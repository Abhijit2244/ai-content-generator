from app.schemas.requests import VariationsRequest


def build_variations_prompt(req: VariationsRequest) -> str:
    count = min(max(req.count, 1), 3)

    return (
        f"You are a master creative content strategist. "
        f"Your task is to generate {count} DISTINCT and meaningfully differentiated alternative variations "
        f"for the following {req.contentType} draft.\n\n"
        f"Topic / Title: {req.title}\n"
        f"Tone: {req.tone}\n\n"
        f"ORIGINAL CONTENT:\n"
        f'"""\n{req.content.strip()}\n"""\n\n'
        f"REQUIREMENTS FOR THE {count} VARIATIONS:\n"
        f"1. Each variation must explore a distinct creative angle, structure, or emotional hook.\n"
        f"2. Separate each variation clearly using the exact separator: `===VARIATION_BREAK===`.\n"
        f"3. Do not include conversational introductory or concluding commentary. Only return the content of the variations separated by `===VARIATION_BREAK===`."
    )
