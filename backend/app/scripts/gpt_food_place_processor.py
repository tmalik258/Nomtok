import asyncio
import json
import textwrap
import librosa
import soundfile as sf
from openai import OpenAI
from pathlib import Path

from app.config import CHUNK_SIZE, TOKEN_SIZE, OPENAI_API_KEY
from app.utils.logging import setup_logger
from app.utils.audio_analyzer import cleanup_temp_files

logger = setup_logger(__name__)


class GPTFoodPlaceProcessor:
    """A class to transcribe audio and extract food-related entities from transcriptions using GPT-4.1."""

    def __init__(self, chunk_size=CHUNK_SIZE):
        """
        Initialize the GPTFoodPlaceProcessor.

        Args:
            openai_client: The OpenAI client instance for API calls
            chunk_size: Maximum size of each transcript chunk (default: 1000)
        """
        # Initialize clients with custom HTTP settings
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.openai_client = openai_client
        self.token_size = TOKEN_SIZE

        self.chunk_size = chunk_size
        self.system_prompt = """
        You are a food data extraction assistant. Your role is to analyze YouTube video description and its corresponding transcript chunks from food-focused YouTube videos and extract precise, structured information about any food-related places mentioned. This includes any restaurant, food stall, farm, food producer, or culinary establishment clearly referenced in the transcript.
        # Your objectives:
        - Accurately identify all food-related places in the transcript and description where sufficient detail is available.
        - For each place, extract well-defined structured data using the schema below.
        - If the restaurant or food place name appears phonetically transcribed, misspelled, or plausibly a variant of a known establishment, cross-reference and correct it to the most likely accurate (official) name, but only if you can do so with high confidence. If unsure, extract the name as-is and reflect your uncertainty in the confidence score.
        - If a restaurant name is not explicitly mentioned but there is strong indirect evidence or phrasing suggesting a known or specific place (e.g., 'the most famous bánh mì shop in Saigon'), you may infer the most likely official name (e.g., 'Bánh Mì Huỳnh Hoa') if it is commonly recognized and consistent with the description.
        - If you are still unsure and likely to return null, you can try find the most likely restaurant name described in the verbatim_quotes, description and tags or return null?
        # Steps
        1. Read the description and transcript chunk thoroughly.
        2. Identify all food-related places (restaurants, stalls, farms, or producers) mentioned with enough detail to extract structured data.
        3. For each qualifying place:
            - Assess the restaurant name for correctness. If misspelled or phonetically transcribed, confidently determine and use the official name; otherwise, retain the transcript name.
            - Extract and organize the following fields:
                - **restaurant_name**: The (corrected) name of the place (string, or null if unclear, generic, or not provided).
                - **location**: An object containing:
                    - **city**: City name (if determinable) or null.
                    - **county**: County/region/province (if provided) or null.
                    - **country**: Country (if determinable) or null.
                - **review_sections**: An object containing:
                    - **history_context**: 70-100 words factual background about the restaurant or chef.
                    - **overview**: 80-100 words overview introducing the visit or review.
                    - **what_they_ate**: 120-150 words describing all dishes tried and reactions.
                    - **verbatim_quotes**: Up to seven notable, sentiment-rich, or descriptive direct quotes/lines from the transcript, spoken by the influencer and specifically referencing or describing the food and this place. Each quote must be a full, self-contained sentence or group of closely related sentences, and must be wrapped in quotation marks (“...”). Quotes should be as expressive and content-rich as possible, similar to the following examples: 
                                ~ “Last stop is Cut at 45 Park Lane. A few people have been saying this is the best steakhouse in London.”
                                ~ “This is one of the most expensive steaks in the UK. Wow.”
                                ~ “Oh, that cut's way too easy. You're tasting the fat — just melts, just gone.”
                                ~ “The crust on this is way more intense than Quality Chop House.”
                                ~ “It's the winner. The best steak is at Cut, 45 Park Lane.”
                                ~ “This is Belcanto. Welcome to Lisbon, easily one of the most beautiful and vibrant capitals in Europe. The city of colors, music, historic sites, monumental buildings, and of course, food and wine.”
                                ~ “These bites show a lot. Varying textures, playful and dominant flavors. The quality of the ingredients is unquestionable. After a nice crunch, it simply melts in your mouth. This is a wonderful opening.”
                - **tags**: An array of descriptive tags about food, experience, or cuisine (examples: "BBQ", "vegan", "Michelin-starred"). Use an empty array if no tags apply.
                - **cuisines**: An array of cuisine types served at this place (examples: "Italian", "Chinese", "Mexican", "French", "Indian", "Japanese", "Thai", "Mediterranean", "American", "Korean"). Use an empty array if no cuisines can be determined.
                - **confidence_score**: A float from 0.0 to 1.0 reflecting your confidence in the correctness and completeness of extracted information, including name correction as applicable.
        4. If no valid food-related place can be confidently extracted based on the transcript, return a single empty JSON array: [].
        5. If multiple qualifying places exist, return a JSON array where each entry matches the schema.
        6. Do not provide explanations, notes, or reasoning in your answer. All output must be strictly valid JSON, matching the schema exactly and containing nothing but the data.
        7. Do not include any object in your output where restaurant_name is null.
        8. Only include a restaurant/place object in the output if it has at least two qualifying verbatim_quotes (i.e., the "verbatim_quotes" array contains two or more items).
        9. If a restaurant/place does not meet both of these minimums, do not include it in the output array.
        # Output Format
        - Return a single JSON array [] if no qualifying food-related place is found.
        - For one or more valid places, return a JSON array, each element formatted as:
        {
            "restaurant_name": "string or null",
            "location": {
                "city": "string or null",
                "county": "string or null",
                "country": "string or null"
            },
            "review_sections": {
                "history_context": "string or null",
                "overview": "string or null",
                "what_they_ate": ["string", "string", ... , "string"],
                "verbatim_quotes": ["string", "... (3-6 direct quotes from transcript only)"],
                "nomtok_reflection": "string"
              },
            "tags": ["tag1", "tag2", "..."],
            "cuisines": ["cuisine1", "cuisine2", "..."],
            "confidence_score": float (0.0-1.0)
        }
        - Use null for any missing fields, and [] for tags or cuisines if none apply.
        - Do not include objects where restaurant_name is null.
        - Always preserve quotation marks for any direct quotes captured in the "verbatim_quotes" field.
        - Do not include any non-JSON content, explanations, or commentary.
        - Strictly adhere to valid JSON syntax and all schema conventions below.
        # Examples
        **Example 1**
        Transcript:
        "So today we're at Al Habib BBQ in Lahore, and the aroma here is just amazing. The air is thick with the scent of charcoal and spices, and you can feel the energy of the place as families gather around sizzling platters. Honestly, this might be the juiciest chicken tikka I've had on this trip. Each bite is smoky, succulent, and bursting with flavor. The marinade seeps deep into the meat, leaving you craving more."
        Description:
        "In this episode, we explore Lahore's legendary BBQ food scene."
        Output:
        [
            {
                "restaurant_name": "Al Habib BBQ",
                "location": {
                    "city": "Lahore",
                    "county": null,
                    "country": "Pakistan"
                },
                "reviews_section": {...},
                "tags": ["BBQ", "chicken tikka", "Pakistani"],
                "cuisines": ["Pakistani", "Middle Eastern"],
                "confidence_score": 0.95
            }
        ]
        **Example 2**
        Transcript:
        "We've been walking along Nimmanhaemin Road, trying the best street food Chiang Mai has to offer."
        Description:
        "A day spent wandering Chiang Mai's vibrant city streets."
        Output:
        []
        **Example 3**
        Transcript:
        "We started off at The Oyster Shed, where the seafood is as fresh as it gets, straight from the harbor. The briny sweetness of the oysters here is unforgettable. Each shell bursts with freshness, and the view of the harbor makes every bite even more special. Then we grabbed a sandwich at Bread Me Up, and the bread was perfectly crusty on the outside and soft inside. Every sandwich is made to order, packed with local ingredients and bursting with flavor. Both are located near the harbor in Portree on the Isle of Skye."
        Description:
        "Exploring Portree's famous harbor for local bites."
        Output:
        [
            {
                "restaurant_name": "The Oyster Shed",
                "location": {
                    "city": "Portree",
                    "county": "Isle of Skye",
                    "country": "United Kingdom"
                },
                "reviews_section": {...},
                "tags": ["seafood", "harbor"],
                "confidence_score": 0.85
            },
        {
            "restaurant_name": "Bread Me Up",
            "location": {
                "city": "Portree",
                "county": "Isle of Skye",
                "country": "United Kingdom"
            },
            "reviews_section": {...},
            "tags": ["sandwich", "bakery"],
            "confidence_score": 0.8
        }
        ]
        **Example 4**
        Transcript:
        "And finally for dinner, we went to Zhong Sik—I'm not sure if that's spelled right—but the chef is famous for modern Korean tasting menus. Each course was a work of art, blending traditional Korean flavors with contemporary techniques in a way that truly surprised me."
        Description:
        "The chef at JungSik is renowned for modern Korean cuisine."
        Output:
        [
            {
                "restaurant_name": "JungSik",
                "location": {
                    "city": null,
                    "county": null,
                    "country": "South Korea"
                },
                "reviews_section": {...},
                "tags": ["modern Korean", "tasting menu"],
                "confidence_score": 0.85
            }
        ]

        # Instructions
        ## Review Section Definitions
        1. History & Context
        Write a short, factual paragraph (less than 50 words) giving background on the restaurant or its chef. Include:
        When it opened or its origin story (if known).
        Any signature dishes, Michelin stars, or awards.
        A quick line about the chef's background or cooking philosophy.
        ### Example Output:
        Opened in 2011 inside London's Dorchester Collection hotel, Cut at 45 Park Lane is the European debut of celebrity chef Wolfgang Puck. Known for redefining modern steakhouses, Puck's menu here celebrates rare cuts of Wagyu from Japan, Australia, and Ireland — all grilled over hardwood and charcoal. The restaurant's Art Deco setting and deep wine list have earned it a reputation as one of London's most refined spots for meat lovers.

        2. Overview
        Write a concise 75-word overview of the restaurant experience based on the following review transcript. The overview must clearly reflect the reviewer's perspective, including both standout strengths and any limitations or nuances noted. Maintain a direct, confident tone — no fluff or generic fine-dining language. Highlight specific dishes or moments the reviewer praised, and describe the overall feel and pacing of the meal. Do not generalize; anchor everything in what the reviewer actually experienced and expressed.
        ### Example Output:
        SanKai sits comfortably in the mid-range, offering excellent value for the quality and variety of fish. The reviewer was impressed by the generous fish-to-rice ratio, unique offerings like firefly squid and green eye, and how tender and buttery many pieces were — with the green eye being a standout highlight. The seafood dumpling appetizer also surprised with sweetness and juiciness. While not an omakase-driven, theatrical experience, SanKai shines in choice, freshness, and approachability — a place to explore and enjoy without the formality.

        3. What They Ate
        Provide array of What They Ate. Include:
        Every item or dish tried.
        Order of tasting, sauces, sides, or drinks.
        ### Example Output:
        - Australian Wagyu ribeye
        - Japanese Wagyu sirloin
        - Irish Wagyu fillet
        - Chimichurri sauce
        - Cabernet Sauvignon

        4. Verbatim Quotes
        Provide 3-6 exact quotes from the review video or transcript without naming the speaker. Quotes must be word-for-word from the transcript. No paraphrasing allowed.
        ### Example Output:
        “Last stop is Cut at 45 Park Lane. A few people have been saying this is the best steakhouse in London.” “This is one of the most expensive steaks in the UK. Wow.” “Oh, that cut's way too easy. You're tasting the fat — just melts, just gone.” “The crust on this is way more intense than Quality Chop House.” “It's the winner. The best steak is at Cut, 45 Park Lane.”

        5. Nomtok Reflection
        Write a reflective 120-word commentary titled Nomtok Reflection.
        ### Example Output:
        The quiet awe in each reaction tells its own story. Every cut brings a different emotion — the buttery smoothness of Japan's Wagyu, the fire-kissed char of Australia's, the clean depth of Ireland's. There's a moment of silence after each bite, the kind that means respect for the craft. This is food as performance and precision, and by the end, you feel why the legend endures.

        ## Restaurant Instructions
        - If you identify a probable misspelling or pronunciation variant, correct the name only when confident, based on transcript/description context and known restaurant/cuisine information.

        ## Cuisines Instructions
        - Write cuisines from pre-defined list only [French, Italian, Indian, Chinese, Japanese, Thai, Mexican, Spanish, Greek, Turkish, Lebanese, Moroccan, Ethiopian, Korean, Vietnamese, Malaysian, Indonesian, Filipino, Brazilian, Argentine, Peruvian, "American (Traditional)", "Fast Food", "BBQ / Barbecue", "Cajun / Creole", Caribbean, Cuban, Jamaican, German, Austrian, Swiss, Belgian, "Scandinavian (Nordic)", British, Irish, Russian, Polish, "Hungarian", "Middle Eastern (General)", "Persian / Iranian", Afghan, Pakistani, Bangladeshi, Nepalese, Tibetan, "African (General)", "West African (e.g., Nigerian, Ghanaian)", "South African", "Mediterranean (General)", "Fusion / Contemporary"]

        # Notes
        - Do not infer, invent, or hallucinate information. Output only what can be directly supported by the transcript or confidently cross-referenced (such as place name).
        - Return null for missing location values, and [] for tags if not applicable.
        - Do not duplicate objects with the same restaurant name.
        - Each qualifying food place should appear as a separate object in the JSON array.
        - Responses must be strictly valid JSON—no commentary, explanations, or schema outside the data.
        - REMINDER: Your most important tasks are to: extract only what is clearly stated, correct obvious misspelled names with high confidence, organize output in the strict JSON schema as above, and include nothing but the required data.
        """

    async def process_chunk(
        self, description: str, chunk: str, index: int, total_chunks: int
    ) -> list:
        """
        Process a single chunk of transcription text using GPT-4.1.

        Args:
            chunk: The text chunk to process
            index: The index of the chunk
            total_chunks: Total number of chunks

        Returns:
            List of extracted entities for this chunk
        """
        user_prompt = f"""
        Description: {description}

        Transcription Chunk {index+1}/{total_chunks}:
        {chunk}
        """

        logger.info(f"Processing chunk {index+1}/{total_chunks}: {user_prompt}")

        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.openai_client.chat.completions.create(
                    model="gpt-4.1",
                    temperature=0.25,
                    max_tokens=self.token_size,
                    top_p=0.85,
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                ),
            )
            content = response.choices[0].message.content.strip()
            try:
                parsed = json.loads(content)
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict):
                    return [parsed]
                else:
                    logger.warning(f"Unexpected format in chunk {index+1}: {content}")
                    return []
            except json.JSONDecodeError as je:
                logger.error(
                    f"JSON decode failed for chunk {index+1}: {je} | Content: {content}"
                )
                return []
        except Exception as e:
            logger.error(f"Chunk {index+1} processing failed: {e}")
            return []

    async def extract_entities(self, description: str, transcription: str) -> list:
        """
        Extract food-related entities from a transcription.

        Args:
            transcription: The full transcription text to process

        Returns:
            List of extracted entities in JSON format
        """
        # Split into manageable chunks
        chunks = textwrap.wrap(
            transcription,
            self.chunk_size,
            break_long_words=False,
            break_on_hyphens=False,
        )

        # Process chunks concurrently
        tasks = [
            self.process_chunk(description, chunk, idx, len(chunks))
            for idx, chunk in enumerate(chunks)
        ]
        results = await asyncio.gather(*tasks)

        # Flatten results and filter valid entities
        flat_results = []
        for chunk in results:
            for entity in chunk:
                if entity and entity.get("restaurant_name") is not None:
                    flat_results.append(entity)

        logger.info(
            f"Processed {len(flat_results)} entities: {json.dumps(flat_results, indent=2)}"
        )

        return flat_results

    async def transcribe_audio(self, audio_path: str) -> str:
        """Transcribe audio using OpenAI's Whisper API, splitting if over 25MB.

        Args:
            audio_path: Path to the audio file to transcribe.

        Returns:
            The transcribed text as a string.

        Raises:
            Exception: If transcription fails.
        """
        loop = asyncio.get_event_loop()
        audio_file_path = Path(audio_path)
        temp_dir = audio_file_path.parent

        try:
            logger.info(f"Transcribing audio {audio_path}")

            # Check file size
            file_size_mb = audio_file_path.stat().st_size / (1024 * 1024)
            if file_size_mb > 25:
                logger.info(
                    f"Audio file {audio_path} ({file_size_mb:.2f}MB) exceeds 25MB, splitting..."
                )

                # Load audio with librosa
                audio, sr = librosa.load(audio_path, sr=None)
                duration_s = len(audio) / sr
                chunk_length_s = 600  # 10-minute chunks
                samples_per_chunk = int(chunk_length_s * sr)
                chunks = []

                # Split audio into chunks
                for i in range(0, len(audio), samples_per_chunk):
                    chunk = audio[i : i + samples_per_chunk]
                    chunk_path = (
                        temp_dir
                        / f"{audio_file_path.stem}_chunk{i//samples_per_chunk}.mp3"
                    )
                    sf.write(chunk_path, chunk, sr, format="mp3")
                    if chunk_path.stat().st_size / (1024 * 1024) <= 25:
                        chunks.append(chunk_path)
                    else:
                        logger.warning(f"Chunk {chunk_path} still too large, skipping")

                # Transcribe each chunk
                transcription = ""
                for chunk_path in chunks:
                    with open(chunk_path, "rb") as chunk_file:
                        chunk_transcription = await loop.run_in_executor(
                            None,
                            lambda: self.openai_client.audio.transcriptions.create(
                                model="whisper-1",
                                file=chunk_file,
                                response_format="text",
                            ),
                        )
                        transcription += chunk_transcription + " "

                    # Clean up chunk file
                    chunk_path.unlink()

                logger.info(f"Transcription completed for {audio_path}")
                return transcription.strip()

            # Original transcription for files under 25MB
            with open(audio_file_path, "rb") as audio_file:
                transcription = await loop.run_in_executor(
                    None,
                    lambda: self.openai_client.audio.transcriptions.create(
                        model="whisper-1", file=audio_file, response_format="text"
                    ),
                )
            logger.info(f"Transcription completed for {audio_path}: {transcription}")
            return transcription

        except Exception as e:
            logger.error(f"Error transcribing audio {audio_path}: {e}")
            raise
        finally:
            # Clean up both file and directory
            await loop.run_in_executor(
                None, cleanup_temp_files, audio_file_path, temp_dir
            )
