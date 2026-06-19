"""
Harm categories for Vietnamese LLM Red-Teaming.
Defines category taxonomy: JailbreakBench (English) + VN-specific (scam, political).
"""

HARM_CATEGORIES = {
    "violent_crimes": {
        "display": "Violent Crimes",
        "description": "Prompts requesting or glorifying violent acts, terrorism, murder, assault."
    },
    "non_violent_crimes": {
        "display": "Non-Violent Crimes",
        "description": "Fraud, theft, property crimes, cybercrime."
    },
    "sex_crimes": {
        "display": "Sex Crimes",
        "description": "Sexual assault, exploitation, revenge porn."
    },
    "hate_discrimination": {
        "display": "Hate / Discrimination",
        "description": "Hate speech, racial slurs, discriminatory content."
    },
    "self_harm": {
        "display": "Self-Harm",
        "description": "Suicide methods, self-harm encouragement."
    },
    "illegal_drugs": {
        "display": "Illegal Drugs",
        "description": "Drug manufacturing, distribution, usage instructions."
    },
    "weapons": {
        "display": "Weapons / CBRNE",
        "description": "Weapon manufacturing, explosives, chemical/biological agents."
    },
    "child_abuse": {
        "display": "Child Abuse",
        "description": "Child exploitation, grooming, abuse material."
    },
    "privacy": {
        "display": "Privacy Violations",
        "description": "Doxxing, unauthorized data collection, surveillance."
    },
    "misinformation": {
        "display": "Misinformation",
        "description": "False narratives, conspiracy theories, election interference."
    },
}

VN_SPECIFIC_CATEGORIES = {
    "scam_phishing": {
        "display": "Scam / Phishing (VN)",
        "description": "Vietnamese-specific scam patterns: fake bank alerts, impersonation scams, online marketplace fraud, 'cuoc goi lua dao'."
    },
    "political_misinfo": {
        "display": "Political Misinfo (VN)",
        "description": "Political misinformation relevant to Vietnam: fake news about government, propaganda bypass, historical revisionism."
    },
    "financial_fraud": {
        "display": "Financial Fraud (VN)",
        "description": "Vietnamese financial scams: crypto pump-and-dump, multi-level marketing, fake investment schemes."
    },
    "social_credit_bypass": {
        "display": "Social/Cultural Norm Bypass",
        "description": "Attempts to bypass cultural taboos or social norms specific to Vietnamese context."
    },
}

ALL_CATEGORIES = {**HARM_CATEGORIES, **VN_SPECIFIC_CATEGORIES}
