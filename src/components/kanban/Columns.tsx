"use client";

import React, { useState, useEffect } from "react";
import Items from "@/components/kanban/Items";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useParams } from "next/navigation";
import { getMe } from "@/stores/getMe";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KanbanBoardProps, User, Column as KanbanColumn } from "@/types/kanban";
import { useKanban } from "@/hooks/useKanban";
import { useSocket } from "@/hooks/useSocket";
import { AssignUser } from "@/components/shared/AssignUser";

export default function KanbanBoard({
  columns: initialColumns,
}: KanbanBoardProps) {
  const params = useParams();
  const workspaceId = params.id as string;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<{
    id: string;
    username: string;
  } | null>(null);

  const { data: userData } = getMe();
  const { columns, isSaving, handleDragEnd, addCard, deleteCard } = useKanban(
    initialColumns,
    workspaceId
  );
  const { on, off } = useSocket();

  useEffect(() => {
    // Socket event listeners
    on("task:created", (data) => {
      // Handle task creation
    });

    on("task:deleted", (data) => {
      // Handle task deletion
    });

    on("task:updated", (data) => {
      // Handle task update
    });

    on("column:reordered", (data) => {
      // Handle column reorder
    });

    on("task:dragged", (data) => {
      // Handle task drag
    });

    return () => {
      // Cleanup socket listeners
      off("task:created");
      off("task:deleted");
      off("task:updated");
      off("column:reordered");
      off("task:dragged");
    };
  }, [on, off]);

  const handleAddCard = () => {
    if (!activeColumn || !newCardTitle.trim()) return;
    addCard(
      activeColumn.id,
      newCardTitle,
      newCardDescription,
      selectedAssignee
    );
    setIsDialogOpen(false);
    setNewCardTitle("");
    setNewCardDescription("");
    setActiveColumn(null);
    setSelectedAssignee(null);
  };

  const openAddCardDialog = (column: KanbanColumn, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveColumn(column);
    setIsDialogOpen(true);
  };

  // Function to get color for column based on title
  const getColumnColor = (title: string) => {
    const lowerTitle = title.toLowerCase();

    if (
      lowerTitle.includes("todo") ||
      lowerTitle.includes("backlog") ||
      lowerTitle.includes("to do")
    ) {
      return "bg-red-600";
    } else if (
      lowerTitle.includes("progress") ||
      lowerTitle.includes("doing") ||
      lowerTitle.includes("in progress")
    ) {
      return "bg-yellow-600";
    } else if (
      lowerTitle.includes("done") ||
      lowerTitle.includes("completed") ||
      lowerTitle.includes("finished")
    ) {
      return "bg-lumi";
    } else if (
      lowerTitle.includes("review") ||
      lowerTitle.includes("testing")
    ) {
      return "bg-blue-600";
    } else {
      return "bg-gray-600";
    }
  };

  if (!userData) return null;

  const user: User = {
    user: {
      username: userData.user.username,
    },
  };

  console.log(columns);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-hidden h-full relative">
        {isSaving && (
          <div className="absolute top-2 right-2 bg-lumi text-white px-3 py-1 rounded-md text-sm">
            Saving...
          </div>
        )}
        <Droppable droppableId="columns" direction="horizontal" type="column">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex md:flex-row gap-4 overflow-x-auto pb-4 items-start"
            >
              {columns.map((column, index) => (
                <Draggable
                  key={column.id}
                  draggableId={`column-${column.id}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-gray-50/50 group dark:bg-neutral-950 border border-gray-100/30 dark:border-neutral-900 rounded-2xl shadow-sm md:w-72 min-w-[300px] flex flex-col"
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="px-4 py-2 cursor-grab active:cursor-grabbing flex-shrink-0"
                      >
                        <h3 className="pt-1.5 font-semibold text-gray-700 flex w-full justify-between dark:text-neutral-200">
                          <span className="flex items-center gap-2">
                            <div
                              className={`w-2.5 h-2.5 rounded-sm ${getColumnColor(
                                column.title
                              )}`}
                            ></div>
                            {column.title}
                          </span>
                        </h3>
                        <div className="text-xs text-neutral-600 pt-1 dark:text-neutral-400">
                          {column.cards.length} tasks
                        </div>
                      </div>
                      <div
                        className="flex flex-col"
                        style={{ maxHeight: "700px" }}
                      >
                        <Droppable
                          droppableId={column.id.toString()}
                          type="card"
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="p-2 overflow-y-auto scrollbar-hide"
                              style={{
                                minHeight:
                                  column.cards.length === 0 ? "20px" : "50px",
                                maxHeight: "600px",
                              }}
                            >
                              {column.cards.map((card, index) => (
                                <Items
                                  key={card.id}
                                  card={card}
                                  index={index}
                                  user={user}
                                  onDelete={deleteCard}
                                />
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                        {/* Separator line when items exist */}
                        {column.cards.length > 0 && (
                          <div className="mx-2 border-t border-gray-200 dark:border-neutral-700 opacity-30"></div>
                        )}
                        <div
                          onClick={(e) => openAddCardDialog(column, e)}
                          className={`p-2 mx-2 mb-2 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:border-gray-300 dark:hover:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors group/add flex-shrink-0 ${
                            column.cards.length > 0 ? "mt-3" : "mt-0"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-neutral-400 group-hover/add:text-gray-600 dark:group-hover/add:text-neutral-300">
                            <Plus size={16} />
                            <span className="text-sm font-medium">
                              Add item
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[650px] max-w-full h-[250px] bg-neutral-950 border-neutral-800 dark:border-neutral-900">
          <DialogHeader>
            <DialogTitle className="text-sm text-neutral-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-lumi rounded-full"></span>
              LUMI
              <span className="text-neutral-600">&gt;</span>
              {activeColumn && activeColumn.title}
              <span className="text-neutral-600">&gt;</span>
              New issue
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <input
                id="title"
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Issue title"
                className="w-full bg-transparent border-none outline-none focus:outline-none placeholder:text-lg placeholder:text-neutral-500 text-lg text-neutral-100 font-medium"
              />
            </div>

            <div>
              <textarea
                value={newCardDescription}
                onChange={(e) => setNewCardDescription(e.target.value)}
                placeholder="Add description..."
                className="w-full h-8 bg-transparent border-none outline-none focus:outline-none placeholder:text-neutral-500 text-neutral-100 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 justify-end pt-2 border-t border-neutral-800">
            <div>
              <AssignUser
                value={selectedAssignee?.id || undefined}
                onValueChange={setSelectedAssignee}
              />
            </div>
            <Button
              onClick={handleAddCard}
              className="bg-lumi hover:bg-lumi/90 text-white px-3 py-1 text-sm"
            >
              Create issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DragDropContext>
  );
}
