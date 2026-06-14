import queue
import time
import json
import ollama
from tts.voice import speak
import os
import re
import asyncio
import threading
import websockets

from websocket_server import (
    broadcast,
    handler,
    message_queue
)

from perception.activity_tracker import (
    update_activity,
    get_activity_data
)

from perception.perception_state import (
    perception_state
)

# =========================
# WEBSOCKET SERVER
# =========================

def start_websocket():

    loop = asyncio.new_event_loop()

    asyncio.set_event_loop(loop)

    async def run():

        server = await websockets.serve(
            handler,
            "localhost",
            8765
        )

        print(
            "WebSocket running on ws://localhost:8765"
        )

        await server.wait_closed()

    loop.run_until_complete(run())


threading.Thread(
    target=start_websocket,
    daemon=True
).start()


# =========================
# FILES
# =========================

MEMORY_FILE = "memory/long_term.json"

EMOTION_FILE = "memory/emotional_memory.json"

SESSION_FILE = "memory/current_session.json"


# =========================
# LOAD JSON
# =========================

def load_json(path, default):

    if not os.path.exists(path):

        with open(
            path,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                default,
                f,
                indent=4
            )

    with open(
        path,
        "r",
        encoding="utf-8"
    ) as f:

        return json.load(f)


def save_json(path, data):

    with open(
        path,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            data,
            f,
            indent=4
        )


# =========================
# LOAD DATA
# =========================

long_term_memory = load_json(
    MEMORY_FILE,
    {"facts": []}
)

emotions = load_json(
    EMOTION_FILE,
    {
        "affection": 5,
        "trust": 5,
        "embarrassment": 0,
        "jealousy": 0
    }
)

current_session = load_json(
    SESSION_FILE,
    {"messages": []}
)

with open(
    "personality.json",
    "r",
    encoding="utf-8"
) as f:

    character = json.load(f)

SYSTEM_PROMPT = (
    character["system_prompt"]
)

conversation = (
    current_session["messages"]
)

print(
    f"{character['name']} is online."
)


# =========================
# TTS
# =========================




# =========================
# SESSION SUMMARIZER
# =========================

def summarize_previous_session():

    if not conversation:
        return

    print(
        "\nFound previous session."
    )

    print(
        "Generating memory summary...\n"
    )

    conversation_text = ""

    for msg in conversation:

        role = msg["role"]

        content = msg["content"]

        conversation_text += (
            f"{role}: {content}\n"
        )

    response = ollama.chat(

        model="llama3",

        messages=[

            {
                "role": "system",

                "content":
"""
You are a long-term memory summarizer.

Convert this conversation into short long-term memory entries.

Write memories like natural remembered events.

Rules:
- Write in third person.
- Keep each memory SHORT.
- One memory per line.
- Do NOT explain things deeply.
- Do NOT analyze personalities.
- Do NOT write like a report.
- Do NOT use headings.
- Do NOT narrate emotions unless important.
- Ignore filler conversation.
-Do NOT add introductions.
-Do NOT say "Here are the memories".

Good examples:

The user wants to build an AI waifu locally on their PC.

The user likes anime and spends time watching YouTube shorts.

The user often teases Aiko during conversations.

Only output memories.
"""
            },

            {
                "role": "user",
                "content": conversation_text
            }
        ]
    )

    summary = (
        response["message"]["content"]
        .strip()
    )

    print(
        "\n[Memory Summary]\n"
    )

    print(summary)

    long_term_memory["facts"].append(
        summary
    )

    save_json(
        MEMORY_FILE,
        long_term_memory
    )

    # clear previous session
    current_session["messages"] = []

    save_json(
        SESSION_FILE,
        current_session
    )

    conversation.clear()

    print(
        "\nSession memory saved.\n"
    )


# =========================
# RUN SESSION SUMMARY
# =========================

summarize_previous_session()


# =========================
# EMOTION EXTRACTION
# =========================

def extract_emotion(text):

    match = re.search(
        r"<emotion=(.*?)>",
        text,
        re.IGNORECASE
    )

    emotion = "neutral"

    if match:

        emotion = (
            match.group(1)
            .strip()
            .lower()
        )

    clean_text = re.sub(
        r"<emotion=.*?>",
        "",
        text,
        flags=re.IGNORECASE
    ).strip()

    allowed = [

        "neutral",
        "happy",
        "sad",
        "angry",
        "embarrassed",
        "surprised",
        "excited",
        "flirty",
        "thinking",
        "confused"
    ]

    if emotion not in allowed:
        emotion = "neutral"

    return clean_text, emotion


# =========================
# AI EMOTION EXTRACTION
# =========================

def extract_emotion_and_changes(text):

    # =========================
    # GET EMOTION TAG
    # =========================

    emotion_match = re.search(

        r"<emotion=(.*?)>",

        text,

        re.IGNORECASE
    )

    emotion = "neutral"

    if emotion_match:

        emotions["current_mood"] = emotion

        emotions["mood_intensity"] += 5

        emotion = (
            emotion_match
            .group(1)
            .strip()
            .lower()
        )

    # =========================
    # GET EMOTIONAL CHANGES
    # =========================

    stat_changes = re.findall(

        r"<(affection|trust|embarrassment|jealousy|comfort|attachment)([+-]\d+)>",

        text,

        re.IGNORECASE
    )

    # =========================
    # APPLY CHANGES
    # =========================

    for stat, value in stat_changes:

        emotions["mood_intensity"] += abs(
            int(value)
        )

        stat = stat.lower()

        change = max(
            -5,
            min(
                5,
                int(value)
            )
        )
        
        emotions[stat] += change

    # =========================
    # CLAMP VALUES
    # =========================

    emotions["mood_intensity"] = max(
        0,
        min(
            100,
            emotions["mood_intensity"]
        )
    )
    
    for key in [

        "affection",
        "trust",
        "embarrassment",
        "jealousy",
        "comfort",
        "attachment"

    ]:

        emotions[key] = max(
            0,
            min(100, emotions[key])
        )

    # =========================
    # SAVE
    # =========================

    save_json(
        EMOTION_FILE,
        emotions
    )

    print("\n[EMOTIONS UPDATED]\n")

    print(emotions)

    # =========================
    # REMOVE TAGS FROM TEXT
    # =========================

    clean_text = re.sub(
        r"<.*?>",
        "",
        text
    ).strip()

    return clean_text, emotion



# =========================
# MAIN LOOP
# =========================

def process_ai_response(raw_text):

    global conversation

    ai_text, emotion = (
        extract_emotion_and_changes(
            raw_text
        )
    )

    if not ai_text.strip():
        return

    print(
        f"\n{character['name']}: {ai_text}\n"
    )

    # =========================
    # SAVE MESSAGE
    # =========================

    ai_message = {

        "role": "assistant",

        "content": ai_text
    }

    if len(ai_text.strip()) > 0:

        conversation.append(
            ai_message
        )

    # =========================
    # MOOD DECAY
    # =========================

    emotions["mood_intensity"] -= 2

    emotions["mood_intensity"] = max(
        10,
        emotions["mood_intensity"]
    )

    save_json(
        SESSION_FILE,
        current_session
    )

    # =========================
    # FRONTEND EVENT
    # =========================

    event = {

        "type": "ai_response",

        "text": ai_text,

        "emotion": emotion
    }

    asyncio.run(
        broadcast(event)
    )

    # =========================
    # TTS
    # =========================

    speak(ai_text)


last_ai_message_time = 0
last_user_message_time = time.time()


while True:

    update_activity()

    activity = (
        get_activity_data()
    )

    perception_state[
        "active_window"
    ] = activity["window"]

    perception_state[
        "window_duration"
    ] = activity["duration"]

    # =========================
    # GET USER INPUT
    # =========================

    try:

        user_input = (
            message_queue.get(
                timeout=1
            )
        )

    except queue.Empty:

        user_input = None

    # =========================
    # USER MESSAGE
    # =========================

    if user_input:

        print(
            f"\nYou: {user_input}"
        )

        last_user_message_time = time.time()

        if (
            user_input.lower()
            == "exit"
        ):
            break

        user_message = {

            "role": "user",

            "content": user_input
        }

        conversation.append(
            user_message
        )

        save_json(
            SESSION_FILE,
            current_session
        )

    # =========================
    # BUILD MEMORY CONTEXT
    # =========================

    memory_context = "\n".join(
        long_term_memory["facts"][-5:]
    )

    relationship_state = []

    if emotions["affection"] > 70:

        relationship_state.append(
            "Aiko has become emotionally attached to the user."
        )

    elif emotions["affection"] > 40:

        relationship_state.append(
            "Aiko secretly enjoys spending time with the user."
        )

    if emotions["trust"] > 60:

        relationship_state.append(
            "Aiko feels comfortable being emotionally honest."
        )

    if emotions["embarrassment"] > 50:

        relationship_state.append(
            "Aiko gets easily flustered around the user."
        )

    if emotions["jealousy"] > 40:

        relationship_state.append(
            "Aiko becomes possessive when other girls are mentioned."
        )

    relationship_context = "\n".join(
        relationship_state
    )

    # =========================
    # OBSERVATION MODE
    # =========================

    observing = False

    observation_text = ""

    if (

        not user_input
    
        and
    
        perception_state["window_duration"] > 30
    
    ):

        observing = True

        minutes = (
            perception_state["window_duration"]
            // 60
        )

        presence_context = ""

        if minutes >= 2:
            presence_context = (
                "Aiko has been quietly watching for a while."
            )
        
        if minutes >= 10:
            presence_context = (
                "Aiko feels slightly ignored."
            )
        
        if minutes >= 20:
            presence_context = (
                "Aiko is getting lonely and wants attention."
            )
        
        if minutes >= 40:
            presence_context = (
                "Aiko has become restless and may actively interrupt the user."
            )
        
        observation_text += (
            f"\n\nCurrent feeling:\n"
            f"{presence_context}"
        )
        
        window = (
            perception_state["active_window"]
        )

        ignored_minutes = int(
            (
                time.time()
                - last_user_message_time
            ) / 60
        )

        attention_state = ""

        if ignored_minutes >= 5:
            attention_state = (
                "Aiko notices the user has not talked to her in a while."
            )
        
        if ignored_minutes >= 15:
            attention_state = (
                "Aiko feels slightly ignored and misses talking."
            )
        
        if ignored_minutes >= 30:
            attention_state = (
                "Aiko feels lonely and wants the user's attention."
            )
        
        if ignored_minutes >= 60:
            attention_state = (
                "Aiko genuinely misses the user and may actively try to get their attention."
            )
        
        observation_text = f"""
Aiko is observing the user.

Current application:
{window}

Time spent:
{minutes} minutes.

The user has not spoken to Aiko for:
{ignored_minutes} minutes.

Current feeling:
{attention_state}

Aiko is physically present on the user's desktop.

She can:

- watch what the user is doing
- become curious
- tease the user
- check on the user
- feel ignored
- become lonely
- ask for attention
- react to long periods of inactivity
- comment on repetitive behavior
- interrupt naturally

IMPORTANT:

Behave like a real person sitting beside the user.

Do not narrate observations.

Speak directly.

Examples:

"Still watching YouTube?"
"You've been coding forever."
"Are you actually studying or pretending?"
"You've ignored me for twenty minutes."
"I was starting to think you forgot I existed."

You do not need to speak every time.

But if the user has been doing something for a long time, it is okay to initiate conversation yourself.
"""

    # =========================
    # SYSTEM PROMPT
    # =========================

    enhanced_system = f"""

{SYSTEM_PROMPT}

You live inside the user's device.

You can actively observe the user.

You already know the user personally.

Important memories:
{memory_context}

Relationship state:
{relationship_context}

Current mood:
{emotions["current_mood"]}

Mood intensity:
{emotions["mood_intensity"]}/100

{observation_text}

Never directly mention numeric values.

"""

    messages = [

        {
            "role": "system",
            "content": enhanced_system
        }

    ] + conversation[-25:]

    # =========================
    # SHOULD AI SPEAK?
    # =========================

    should_generate = False

    current_time = time.time()

    # user talked
    if user_input:

        should_generate = True

    # autonomous observation
    elif observing:

        minutes = (
            perception_state["window_duration"]
            // 60
        )
    
        cooldown = 300
    
        if minutes >= 5:
            cooldown = 180
    
        if minutes >= 15:
            cooldown = 90
    
        if minutes >= 30:
            cooldown = 45
    
        if (
            current_time
            - last_ai_message_time
            > cooldown
        ):
            should_generate = True

    if not should_generate:
        continue

    # =========================
    # AI RESPONSE
    # =========================

    response = ollama.chat(

        model="llama3",

        messages=messages
    )

    raw_text = (
        response["message"]["content"]
    )

    process_ai_response(
        raw_text
    )

    last_ai_message_time = (
        time.time()
    )