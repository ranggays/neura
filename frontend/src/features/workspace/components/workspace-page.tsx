"use client";

import { useMemo, useRef, useState } from "react";
import type {
  AssistantMode,
  ChatMessage,
  EvidenceSourceType,
  PolicyGraphNode,
  ThemeMode,
  WorkspaceDocument,
} from "../types";
import { mockWorkspace } from "../data/mock-workspace";
import { AssistantPanel } from "./assistant-panel";
import { CanvasPanel } from "./canvas-panel";
import { DocumentPreviewPanel } from "./document-preview-panel";
import { ResizeHandle } from "./resize-handle";
import { SourceLibraryPanel } from "./source-library-panel";
import { WorkspaceHeader } from "./workspace-header";

type ResizablePanel = "left" | "preview" | "right";

const collapsedRailWidth = 52;

export function WorkspacePage() {
  const workspace = mockWorkspace;
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(20);
  const [previewWidth, setPreviewWidth] = useState(28);
  const [rightWidth, setRightWidth] = useState(20);
  const [documents, setDocuments] = useState(workspace.documents);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("doc");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [focusedDocumentIds, setFocusedDocumentIds] = useState<string[]>([workspace.documents[0]?.id].filter(Boolean));
  const [graphNodes, setGraphNodes] = useState<PolicyGraphNode[]>(workspace.graphNodes);
  const [activeSourceTypes, setActiveSourceTypes] = useState<EvidenceSourceType[]>([
    "regulation",
    "draft",
    "dataset",
    "audit",
    "court",
    "procurement",
  ]);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState(workspace.graphNodes[0]?.id);
  const [messages, setMessages] = useState<ChatMessage[]>(workspace.messages);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId),
    [documents, selectedDocumentId],
  );

  function startResize(panel: ResizablePanel) {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const bounds = container.getBoundingClientRect();
    const startSizes = {
      left: leftWidth,
      preview: previewWidth,
      right: rightWidth,
    };

    function onPointerMove(event: PointerEvent) {
      const deltaPercent = ((event.clientX - bounds.left) / bounds.width) * 100;

      if (panel === "left") {
        setLeftWidth(clamp(deltaPercent, 16, 34));
      }

      if (panel === "preview") {
        setPreviewWidth(clamp(deltaPercent - startSizes.left, 20, 38));
      }

      if (panel === "right") {
        const nextRight = 100 - deltaPercent;
        setRightWidth(clamp(nextRight, 16, 34));
      }
    }

    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function selectDocument(document: WorkspaceDocument) {
    setSelectedDocumentId(document.id);
    setFocusedDocumentIds((current) => (current.includes(document.id) ? current : [document.id, ...current]));
  }

  function uploadSource() {
    if (uploading) {
      return;
    }

    setUploading(true);
    window.setTimeout(() => {
      const newDocument: WorkspaceDocument = {
        id: `uploaded-${Date.now()}`,
        title: "Uploaded Research Extract",
        summary: "Newly uploaded source queued for vectorization, preview, and canvas extraction.",
        size: "540 KB",
        date: "Just now",
        status: "Processing",
        type: "PDF",
        viewerUrl: "about:blank",
      };
      setDocuments((current) => [newDocument, ...current]);
      setSelectedDocumentId(newDocument.id);
      setUploading(false);
    }, 800);
  }

  function deleteDocument(documentId: string) {
    setDocuments((current) => current.filter((document) => document.id !== documentId));
    setFocusedDocumentIds((current) => current.filter((id) => id !== documentId));
    setSelectedDocumentId((current) => (current === documentId ? undefined : current));
  }

  function extractDocumentToCanvas() {
    if (!selectedDocument) {
      return;
    }

    setGraphNodes((current) => [
      ...current,
      {
        id: `manual-review-${selectedDocument.id}-${current.length}`,
        label: `${selectedDocument.type} review signal`,
        type: selectedDocument.status === "Processing" ? "DraftBill" : "Topic",
        description: selectedDocument.summary,
        sourceType: selectedDocument.status === "Processing" ? "draft" : "dataset",
        x: 58,
        y: 58,
      },
    ]);
  }

  function toggleFocusedDocument(documentId: string) {
    setFocusedDocumentIds((current) =>
      current.includes(documentId) ? current.filter((id) => id !== documentId) : [...current, documentId],
    );
  }

  function sendAssistantMessage() {
    setAssistantLoading(true);
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `reply-${Date.now()}`,
          role: "assistant",
          body: "I added a concise research angle: compare policy promises against enforceable safeguards and complaint mechanisms.",
          canSendToCanvas: true,
        },
      ]);
      setAssistantLoading(false);
    }, 700);
  }

  function sendMessageToCanvas(message: ChatMessage) {
    setGraphNodes((current) => [
      ...current,
      {
        id: `assistant-review-${message.id}-${current.length}`,
        label: "Manual review insight",
        type: "Topic",
        description: message.body,
        sourceType: "audit",
        x: 18 + (current.length % 4) * 14,
        y: 36 + (current.length % 3) * 12,
      },
    ]);
  }

  function toggleSourceType(sourceType: EvidenceSourceType) {
    setActiveSourceTypes((current) => {
      if (current.includes(sourceType) && current.length > 1) {
        return current.filter((item) => item !== sourceType);
      }

      if (current.includes(sourceType)) {
        return current;
      }

      return [...current, sourceType];
    });
  }

  return (
    <div className={theme === "dark" ? "dark" : undefined}>
      <div className="h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <WorkspaceHeader
          workspace={workspace}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        />
        <main ref={containerRef} className="relative flex h-[calc(100vh-4rem)] overflow-hidden">
          <div className="h-full shrink-0" style={{ width: leftCollapsed ? collapsedRailWidth : `${leftWidth}%` }}>
            <SourceLibraryPanel
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              collapsed={leftCollapsed}
              uploading={uploading}
              onCollapse={() => setLeftCollapsed(true)}
              onExpand={() => setLeftCollapsed(false)}
              onSelectDocument={selectDocument}
              onUpload={uploadSource}
              onDeleteDocument={deleteDocument}
            />
          </div>

          {!leftCollapsed ? <ResizeHandle onStart={() => startResize("left")} /> : null}

          {selectedDocument ? (
            <>
              <div className="h-full shrink-0" style={{ width: `${previewWidth}%` }}>
                <DocumentPreviewPanel
                  document={selectedDocument}
                  onClose={() => setSelectedDocumentId(undefined)}
                  onExtract={extractDocumentToCanvas}
                />
              </div>
              <ResizeHandle onStart={() => startResize("preview")} />
            </>
          ) : null}

          <CanvasPanel
            graphNodes={graphNodes}
            graphEdges={workspace.graphEdges}
            timeline={workspace.timeline}
            activeSourceTypes={activeSourceTypes}
            selectedNodeId={selectedGraphNodeId}
            selectedDocument={selectedDocument}
            theme={theme}
            onToggleSourceType={toggleSourceType}
            onSelectNode={setSelectedGraphNodeId}
          />

          {!rightCollapsed ? <ResizeHandle onStart={() => startResize("right")} /> : null}

          <div className="h-full shrink-0" style={{ width: rightCollapsed ? collapsedRailWidth : `${rightWidth}%` }}>
            <AssistantPanel
              collapsed={rightCollapsed}
              mode={assistantMode}
              historyOpen={historyOpen}
              loading={assistantLoading}
              attachOpen={attachOpen}
              documents={documents}
              selectedDocumentIds={focusedDocumentIds}
              messages={messages}
              history={workspace.history}
              onCollapse={() => setRightCollapsed(true)}
              onExpand={() => setRightCollapsed(false)}
              onModeChange={setAssistantMode}
              onToggleHistory={() => setHistoryOpen((current) => !current)}
              onToggleAttach={() => setAttachOpen((current) => !current)}
              onToggleDocument={toggleFocusedDocument}
              onResetDocuments={() => setFocusedDocumentIds([])}
              onSend={sendAssistantMessage}
              onSendToCanvas={sendMessageToCanvas}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
