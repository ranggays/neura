from app.features.graph.models import (
    EvidenceEdge,
    EvidenceNode,
    EvidenceSnippet,
    GraphPatch,
    NewsSource,
)

SEARCH_SOURCES: list[NewsSource] = [
    NewsSource(
        id="digital-id-review",
        title="Digital identity draft rule moves to inter-ministry review",
        publisher="GovTech Review Indonesia",
        published_at="2026-05-22",
        url="https://example.test/news/digital-id-review",
        type="news",
        snippet="The draft rule enters review as Komdigi coordinates comments from public agencies and privacy advocates.",
        status="available",
    ),
    NewsSource(
        id="pdp-implementation",
        title="PDP implementation guidelines expected after agency coordination",
        publisher="Jakarta Policy Daily",
        published_at="2026-05-10",
        url="https://example.test/news/pdp-implementation",
        type="news",
        snippet="Officials describe implementation steps for personal data protection rules, including controller obligations.",
        status="available",
    ),
    NewsSource(
        id="data-governance-hearing",
        title="DPR hearing raises questions over national data governance",
        publisher="DPR Hearing Notes",
        published_at="2026-04-18",
        url="https://example.test/official/data-governance-hearing",
        type="official",
        snippet="A public hearing records questions about interoperability, safeguards, and responsible institutions.",
        status="available",
    ),
]

GRAPH_PATCHES: dict[str, GraphPatch] = {
    "digital-id-review": GraphPatch(
        source=SEARCH_SOURCES[0],
        nodes=[
            EvidenceNode(
                id="src-digital-id-review",
                label="Digital ID review article",
                type="Source",
                description="Imported news source used as evidence for the extracted subgraph.",
                source_ids=["digital-id-review"],
                review_status="approved",
                x=16,
                y=44,
            ),
            EvidenceNode(
                id="digital-id-draft",
                label="Digital identity draft rule",
                type="Policy",
                description="Draft rule being reviewed across ministries and policy stakeholders.",
                source_ids=["digital-id-review"],
                review_status="auto",
                x=42,
                y=34,
            ),
            EvidenceNode(
                id="komdigi",
                label="Komdigi",
                type="Institution",
                description="Institution connected to digital policy review and implementation coordination.",
                source_ids=["digital-id-review"],
                review_status="auto",
                x=68,
                y=26,
            ),
            EvidenceNode(
                id="privacy-coalition",
                label="Privacy coalition",
                type="Institution",
                description="Civil society group raising consent and oversight concerns.",
                source_ids=["digital-id-review"],
                review_status="review_needed",
                x=66,
                y=62,
            ),
            EvidenceNode(
                id="personal-data-protection",
                label="Personal data protection",
                type="Topic",
                description="Topic covering consent, safeguards, rights, and data governance obligations.",
                source_ids=["digital-id-review"],
                review_status="auto",
                x=40,
                y=74,
            ),
        ],
        edges=[
            EvidenceEdge(
                id="digital-review-mentions-draft",
                from_node_id="src-digital-id-review",
                to_node_id="digital-id-draft",
                label="MENTIONS",
                source_ids=["digital-id-review"],
                evidence=[
                    EvidenceSnippet(
                        source_id="digital-id-review",
                        text="The article names the digital identity draft rule as the policy under review.",
                        location="paragraph 1",
                    )
                ],
                confidence="high",
                review_status="approved",
            ),
            EvidenceEdge(
                id="digital-draft-reviewed-by-komdigi",
                from_node_id="digital-id-draft",
                to_node_id="komdigi",
                label="REVIEWED_BY",
                source_ids=["digital-id-review"],
                evidence=[
                    EvidenceSnippet(
                        source_id="digital-id-review",
                        text="Komdigi is described as coordinating comments from public agencies.",
                        location="paragraph 2",
                    )
                ],
                confidence="high",
                review_status="auto",
            ),
            EvidenceEdge(
                id="digital-draft-criticized-by-coalition",
                from_node_id="digital-id-draft",
                to_node_id="privacy-coalition",
                label="CRITICIZED_BY",
                source_ids=["digital-id-review"],
                evidence=[
                    EvidenceSnippet(
                        source_id="digital-id-review",
                        text="Privacy advocates raised questions about consent and oversight safeguards.",
                        location="paragraph 4",
                    )
                ],
                confidence="medium",
                review_status="review_needed",
            ),
            EvidenceEdge(
                id="digital-draft-affects-data-protection",
                from_node_id="digital-id-draft",
                to_node_id="personal-data-protection",
                label="AFFECTS_TOPIC",
                source_ids=["digital-id-review"],
                evidence=[
                    EvidenceSnippet(
                        source_id="digital-id-review",
                        text="The draft is linked to personal data protection safeguards.",
                        location="paragraph 5",
                    )
                ],
                confidence="medium",
                review_status="auto",
            ),
        ],
    ),
    "pdp-implementation": GraphPatch(
        source=SEARCH_SOURCES[1],
        nodes=[
            EvidenceNode(
                id="src-pdp-implementation",
                label="PDP implementation article",
                type="Source",
                description="News source about implementation guidelines for personal data protection.",
                source_ids=["pdp-implementation"],
                review_status="approved",
                x=16,
                y=22,
            ),
            EvidenceNode(
                id="pdp-law",
                label="UU Perlindungan Data Pribadi",
                type="Policy",
                description="Central legal anchor for personal data protection obligations.",
                source_ids=["pdp-implementation"],
                review_status="auto",
                x=42,
                y=18,
            ),
            EvidenceNode(
                id="data-controller-obligations",
                label="Controller obligations",
                type="Topic",
                description="Implementation area for lawful basis, access limits, and breach response.",
                source_ids=["pdp-implementation"],
                review_status="auto",
                x=68,
                y=18,
            ),
        ],
        edges=[
            EvidenceEdge(
                id="pdp-article-mentions-law",
                from_node_id="src-pdp-implementation",
                to_node_id="pdp-law",
                label="MENTIONS",
                source_ids=["pdp-implementation"],
                evidence=[
                    EvidenceSnippet(
                        source_id="pdp-implementation",
                        text="The article discusses implementation guidance under the PDP law.",
                        location="paragraph 1",
                    )
                ],
                confidence="high",
                review_status="approved",
            ),
            EvidenceEdge(
                id="pdp-law-implements-controller-obligations",
                from_node_id="pdp-law",
                to_node_id="data-controller-obligations",
                label="IMPLEMENTS",
                source_ids=["pdp-implementation"],
                evidence=[
                    EvidenceSnippet(
                        source_id="pdp-implementation",
                        text="Guidelines include controller obligations for processing and breach response.",
                        location="paragraph 3",
                    )
                ],
                confidence="medium",
                review_status="auto",
            ),
        ],
    ),
    "data-governance-hearing": GraphPatch(
        source=SEARCH_SOURCES[2],
        nodes=[
            EvidenceNode(
                id="src-data-governance-hearing",
                label="DPR data hearing notes",
                type="Source",
                description="Official hearing note used as source evidence.",
                source_ids=["data-governance-hearing"],
                review_status="approved",
                x=18,
                y=66,
            ),
            EvidenceNode(
                id="national-data-governance",
                label="National data governance",
                type="Policy",
                description="Policy area covering public data interoperability and institutional responsibility.",
                source_ids=["data-governance-hearing"],
                review_status="auto",
                x=44,
                y=58,
            ),
            EvidenceNode(
                id="dpr-commission",
                label="DPR commission hearing",
                type="Event",
                description="Public forum where policy questions and implementation risks were discussed.",
                source_ids=["data-governance-hearing"],
                review_status="approved",
                x=70,
                y=78,
            ),
        ],
        edges=[
            EvidenceEdge(
                id="hearing-discusses-governance",
                from_node_id="src-data-governance-hearing",
                to_node_id="national-data-governance",
                label="DISCUSSES",
                source_ids=["data-governance-hearing"],
                evidence=[
                    EvidenceSnippet(
                        source_id="data-governance-hearing",
                        text="The hearing notes identify national data governance as the agenda topic.",
                        location="agenda section",
                    )
                ],
                confidence="high",
                review_status="approved",
            ),
            EvidenceEdge(
                id="governance-discussed-in-hearing",
                from_node_id="national-data-governance",
                to_node_id="dpr-commission",
                label="DISCUSSED_IN",
                source_ids=["data-governance-hearing"],
                evidence=[
                    EvidenceSnippet(
                        source_id="data-governance-hearing",
                        text="Commission members raised questions about safeguards and institutional accountability.",
                        location="meeting summary",
                    )
                ],
                confidence="high",
                review_status="approved",
            ),
        ],
    ),
}
