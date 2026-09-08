"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers, Pin, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  EmailBlock,
  addBlockToTemplate,
  partitionBlocks,
  type BlockType,
} from "@/lib/blocks";
import { BLOCK_FIELD_DEFS, useBlockUi } from "@/lib/ui-i18n/block-editor";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/select";
import { useT } from "@/components/locale/locale-provider";
import type { UiTranslationKey } from "@/lib/ui-i18n/translations";
import { accentToneStyles, type AccentTone } from "@/lib/accent-styles";
import { cn } from "@/lib/utils";
import { BlockPalette, BlockPreview } from "./block-preview";
import { LiquidCheatsheet } from "./liquid-cheatsheet";

interface BlockEditorProps {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
  subject?: string;
  preheader?: string;
}

type BlockZone = "header" | "middle" | "footer";

const KEYBOARD_DND_STEPS = [
  "editor.keyboardDnDStep1",
  "editor.keyboardDnDStep2",
  "editor.keyboardDnDStep3",
  "editor.keyboardDnDStep4",
] as const satisfies readonly UiTranslationKey[];

function KeyboardDnDHint({ className }: { className?: string }) {
  const t = useT();

  return (
    <div
      className={cn(
        "rounded-lg border border-[#8ec5ff]/20 bg-gradient-to-br from-[#8ec5ff]/5 to-transparent px-3 py-2.5",
        className,
      )}
    >
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <GripVertical className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {t("editor.keyboardDnDTitle")}
      </p>
      <ol className="space-y-1.5">
        {KEYBOARD_DND_STEPS.map((stepKey, index) => (
          <li key={stepKey} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#8ec5ff]/15 font-mono text-[10px] font-semibold text-[#2563eb] dark:text-[#8ec5ff]"
              aria-hidden
            >
              {index + 1}
            </span>
            <span>{t(stepKey)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const ZONE_TONES: Record<BlockZone, AccentTone> = {
  header: "blue",
  middle: "violet",
  footer: "cyan",
};

export function BlockEditor({ blocks, onChange, subject, preheader }: BlockEditorProps) {
  const t = useT();
  const [liveMessage, setLiveMessage] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ordered = partitionBlocks(blocks);
  const headers = ordered.filter((b) => b.type === "header");
  const footers = ordered.filter((b) => b.type === "footer");
  const middle = ordered.filter((b) => b.type !== "header" && b.type !== "footer");

  function commit(next: EmailBlock[]) {
    onChange(partitionBlocks(next));
  }

  function handleDragEnd(event: DragEndEvent, zone: BlockZone) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const zoneBlocks =
      zone === "header" ? headers : zone === "footer" ? footers : middle;

    const oldIndex = zoneBlocks.findIndex((b) => b.id === active.id);
    const newIndex = zoneBlocks.findIndex((b) => b.id === over.id);
    const reorderedZone = arrayMove(zoneBlocks, oldIndex, newIndex);

    const merged =
      zone === "header"
        ? [...reorderedZone, ...middle, ...footers]
        : zone === "footer"
          ? [...headers, ...middle, ...reorderedZone]
          : [...headers, ...reorderedZone, ...footers];

    const movedBlock = zoneBlocks[oldIndex];
    const newPosition = reorderedZone.findIndex((b) => b.id === active.id) + 1;
    const blockLabel = t(`blocks.${movedBlock.type}.label` as UiTranslationKey);

    commit(merged);
    setLiveMessage(t("a11y.blockMoved", { type: blockLabel, position: newPosition }));
  }

  function updateBlock(id: string, props: Record<string, string>) {
    commit(
      blocks.map((block) =>
        block.id === id ? { ...block, props: { ...block.props, ...props } } : block,
      ),
    );
  }

  function addBlock(type: BlockType) {
    commit(addBlockToTemplate(blocks, type));
    const blockLabel = t(`blocks.${type}.label` as UiTranslationKey);
    setLiveMessage(t("a11y.blockAdded", { type: blockLabel }));
  }

  function removeBlock(id: string) {
    const removed = blocks.find((b) => b.id === id);
    commit(blocks.filter((b) => b.id !== id));
    if (removed) {
      const blockLabel = t(`blocks.${removed.type}.label` as UiTranslationKey);
      setLiveMessage(t("a11y.blockRemoved", { type: blockLabel }));
    }
  }

  return (
    <div className="grid min-h-[640px] min-w-0 gap-0 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)_minmax(0,22rem)]">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
      <div className="space-y-5 border-b border-[#8ec5ff]/15 bg-gradient-to-b from-[#8ec5ff]/5 to-transparent p-6 lg:border-b-0 lg:border-r lg:p-7">
        <BlockPalette onAdd={addBlock} />
        <LiquidCheatsheet />
      </div>

      <div className="space-y-6 bg-gradient-to-b from-[#a78bfa]/5 via-[#8ec5ff]/3 to-transparent p-6 lg:p-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a78bfa]/15 text-[#7c3aed] dark:text-[#c4b5fd]">
            <Layers className="h-4 w-4" />
          </span>
          <p className="label-caps !mb-0">{t("editor.structure")}</p>
          <span className="ml-auto rounded-full border border-[#8ec5ff]/25 bg-[#8ec5ff]/10 px-2 py-0.5 font-mono text-[10px] font-medium text-[#2563eb] dark:text-[#8ec5ff]">
            {t("editor.blocksCount", { count: blocks.length })}
          </span>
        </div>

        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#8ec5ff]/25 bg-gradient-to-br from-[#8ec5ff]/5 to-[#a78bfa]/5 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8ec5ff]/20 to-[#a78bfa]/20">
              <Layers className="h-7 w-7 text-[#7c3aed] dark:text-[#c4b5fd]" />
            </div>
            <p className="mt-3 text-sm font-medium">{t("editor.emptyCanvas")}</p>
            <p className="mt-1 max-w-xs text-xs text-muted">
              {t("editor.emptyCanvasHint")}
            </p>
            <KeyboardDnDHint className="mt-3 max-w-sm" />
          </div>
        ) : (
          <>
            <KeyboardDnDHint />
            <BlockZoneSection
              label={t("editor.headerZone")}
              zone="header"
              blocks={headers}
              sensors={sensors}
              onDragEnd={(e) => handleDragEnd(e, "header")}
              onUpdate={updateBlock}
              onRemove={removeBlock}
              emptyHint={t("editor.addHeader")}
              pinnedLabel={t("editor.pinned")}
            />
            <BlockZoneSection
              label={t("editor.contentZone")}
              zone="middle"
              blocks={middle}
              sensors={sensors}
              onDragEnd={(e) => handleDragEnd(e, "middle")}
              onUpdate={updateBlock}
              onRemove={removeBlock}
              emptyHint={null}
              pinnedLabel={t("editor.pinned")}
            />
            <BlockZoneSection
              label={t("editor.footerZone")}
              zone="footer"
              blocks={footers}
              sensors={sensors}
              onDragEnd={(e) => handleDragEnd(e, "footer")}
              onUpdate={updateBlock}
              onRemove={removeBlock}
              emptyHint={t("editor.addFooter")}
              pinnedLabel={t("editor.pinned")}
            />
          </>
        )}
      </div>

      <div className="min-w-0 border-t border-[#8ec5ff]/15 bg-gradient-to-b from-card to-[#5eead4]/5 p-6 lg:border-l lg:border-t-0 lg:p-7">
        <BlockPreview blocks={ordered} subject={subject} preheader={preheader} />
      </div>
    </div>
  );
}

function BlockZoneSection({
  label,
  zone,
  blocks,
  sensors,
  onDragEnd,
  onUpdate,
  onRemove,
  emptyHint,
  pinnedLabel,
}: {
  label: string;
  zone: BlockZone;
  blocks: EmailBlock[];
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  onUpdate: (id: string, props: Record<string, string>) => void;
  onRemove: (id: string) => void;
  emptyHint: string | null;
  pinnedLabel: string;
}) {
  const isPinned = zone === "header" || zone === "footer";
  const style = accentToneStyles[ZONE_TONES[zone]];
  const zoneLabelId = `block-zone-${zone}`;

  if (blocks.length === 0 && !emptyHint) return null;

  return (
    <div
      role="region"
      aria-labelledby={zoneLabelId}
      className={
        isPinned
          ? cn(
              "rounded-xl border border-dashed p-4 lg:p-5",
              "border-[#8ec5ff]/20 bg-gradient-to-br",
              style.stat,
            )
          : "space-y-4"
      }
    >
      <div className="mb-3 flex items-center gap-2">
        {isPinned && <Pin className="h-3 w-3 text-muted" aria-hidden />}
        <p id={zoneLabelId} className="label-caps !mb-0 !text-[10px]">
          {label}
        </p>
      </div>

      {blocks.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {blocks.map((block, i) => (
                <SortableBlockItem
                  key={block.id}
                  index={i}
                  block={block}
                  pinned={isPinned}
                  pinnedLabel={pinnedLabel}
                  zone={zone}
                  onUpdate={(props) => onUpdate(block.id, props)}
                  onRemove={() => onRemove(block.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableBlockItem({
  block,
  index,
  pinned,
  pinnedLabel,
  zone,
  onUpdate,
  onRemove,
}: {
  block: EmailBlock;
  index: number;
  pinned?: boolean;
  pinnedLabel: string;
  zone: BlockZone;
  onUpdate: (props: Record<string, string>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { label: blockLabel } = useBlockUi(block.type);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = accentToneStyles[ZONE_TONES[zone]];

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        pinned ? cn("border-[#8ec5ff]/25", style.glow) : "border-border",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-5 py-4",
          pinned ? cn("bg-gradient-to-r", style.stat) : "border-border",
        )}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("a11y.dragBlock", { type: blockLabel })}
            className="cursor-grab rounded p-1 text-muted hover:bg-[#8ec5ff]/10 hover:text-foreground focus-ring"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px]", style.chip)}>
            {index + 1}
          </span>
          <span className="text-sm font-medium">{blockLabel}</span>
          {pinned && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase", style.chip)}>
              {pinnedLabel}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("a11y.removeBlock", { type: blockLabel })}
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted" aria-hidden />
        </Button>
      </div>
      <div className="p-5 lg:p-6">
        <BlockFields block={block} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function BlockFields({
  block,
  onUpdate,
}: {
  block: EmailBlock;
  onUpdate: (props: Record<string, string>) => void;
}) {
  const t = useT();
  const fields = BLOCK_FIELD_DEFS[block.type as BlockType];

  if (!fields) return null;

  return (
    <div className="space-y-4">
      {fields.map(({ key, labelKey, mono, type }) => {
        const fieldId = `block-field-${block.id}-${key}`;

        return (
          <div key={key}>
            <Label htmlFor={fieldId}>{t(labelKey)}</Label>
            {type === "select" && key === "style" ? (
              <select
                id={fieldId}
                value={block.props[key] ?? "button"}
                onChange={(e) => onUpdate({ [key]: e.target.value })}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:border-foreground focus-ring"
              >
                <option value="button">{t("blocks.style.button")}</option>
                <option value="link">{t("blocks.style.textLink")}</option>
              </select>
            ) : mono ? (
              <Textarea
                id={fieldId}
                value={block.props[key] ?? ""}
                onChange={(e) => onUpdate({ [key]: e.target.value })}
                rows={key === "text" && block.type === "text" ? 3 : key === "body" ? 12 : 2}
                spellCheck={false}
                className={cn(
                  "font-mono text-sm",
                  key === "body" && "bg-accent/50 text-xs leading-relaxed",
                )}
              />
            ) : (
              <Input
                id={fieldId}
                value={block.props[key] ?? ""}
                onChange={(e) => onUpdate({ [key]: e.target.value })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
