from app.features.ingestion.models import SourceContent
from app.features.search.mock_data import SEARCH_SOURCES

SOURCE_CONTENT_BY_ID: dict[str, SourceContent] = {
    "digital-id-review": SourceContent(
        source=SEARCH_SOURCES[0],
        body=(
            "The digital identity draft rule has moved into inter-ministry review. "
            "Komdigi is coordinating comments from public agencies while a civil society "
            "privacy coalition has raised questions about consent and oversight safeguards. "
            "The draft is linked to personal data protection obligations and public data governance."
        ),
    ),
    "pdp-implementation": SourceContent(
        source=SEARCH_SOURCES[1],
        body=(
            "Officials expect implementation guidelines for UU Perlindungan Data Pribadi "
            "after agency coordination. The guidance discusses controller obligations, "
            "including lawful processing, access limits, and breach response."
        ),
    ),
    "data-governance-hearing": SourceContent(
        source=SEARCH_SOURCES[2],
        body=(
            "DPR commission hearing notes identify national data governance as the agenda topic. "
            "Commission members raised questions about interoperability, safeguards, and institutional accountability."
        ),
    ),
}
