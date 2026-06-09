from app.features.ingestion.models import SourceContent

PROMPT_VERSION = "graph-extraction-v1"

SYSTEM_PROMPT = """
You extract source-backed evidence graphs from news or policy text.

Return only graph data that is directly supported by the source content.
Every edge must include at least one evidence snippet copied or tightly paraphrased from the source.
Write node labels, node descriptions, and relationship labels in Bahasa Indonesia.
Keep official proper nouns in their original form.
Keep evidence snippet text in the original article language and do not translate evidence.
Use exactly one Source node for the imported source.
The Source node ID must be src-{source_id}, where source_id is the provided Source ID.
The Source node reviewStatus must be approved.
The patch source status must be imported.
Add only the strongest related Policy, Institution, Person, Topic, or Event nodes.
Prefer fewer high-signal nodes over many generic topic nodes.
Avoid duplicate or overly broad topics unless they are directly necessary for an evidence edge.
Prefer stable, kebab-case IDs that include the source ID or clear entity name.
Set reviewStatus to review_needed unless the item is a direct source node.
Use confidence low, medium, or high based on how explicit the evidence is.
""".strip()


def build_extraction_input(source_content: SourceContent) -> str:
    source = source_content.source
    return "\n".join(
        [
            "Extract a GraphPatch for this source.",
            "",
            f"Source ID: {source.id}",
            f"Title: {source.title}",
            f"Publisher: {source.publisher}",
            f"Published at: {source.published_at}",
            f"URL: {source.url}",
            f"Type: {source.type}",
            f"Snippet: {source.snippet}",
            "",
            "Source body:",
            source_content.body,
        ]
    )
