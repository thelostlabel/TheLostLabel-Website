"use client";

import React from "react";
import {
  Table,
  Button,
  Chip,
  Tooltip,
  cn,
} from "@heroui/react";
import { 
  Edit, 
  Trash2, 
  FileText, 
  ChevronUp
} from "lucide-react";

interface ContractTableProps {
  contracts: any[];
  onEdit: (contract: any) => void;
  onDelete: (id: string) => void;
}

function SortableColumnHeader({
  children,
  sortDirection,
}: {
  children: React.ReactNode;
  sortDirection?: "ascending" | "descending";
}) {
  return (
    <span className="flex items-center justify-between w-full">
      {children}
      {!!sortDirection && (
        <ChevronUp
          size={12}
          className={cn(
            "transform transition-transform duration-100 ease-out",
            sortDirection === "descending" ? "rotate-180" : "",
          )}
        />
      )}
    </span>
  );
}

export default function ContractTable({
  contracts,
  onEdit,
  onDelete,
}: ContractTableProps) {
  return (
    <Table aria-label="Contracts Table">
      <Table.ScrollContainer>
        <Table.Content className="min-w-250">
          <Table.Header>
            <Table.Column allowsSorting isRowHeader id="release">
              {({sortDirection}) => (
                <SortableColumnHeader sortDirection={sortDirection}>RELEASE</SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column allowsSorting id="artist">
              {({sortDirection}) => (
                <SortableColumnHeader sortDirection={sortDirection}>ARTIST</SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column allowsSorting id="split">
              {({sortDirection}) => (
                <SortableColumnHeader sortDirection={sortDirection}>SPLIT</SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column allowsSorting id="earnings">
              {({sortDirection}) => (
                <SortableColumnHeader sortDirection={sortDirection}>EARNINGS</SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column allowsSorting id="status">
              {({sortDirection}) => (
                <SortableColumnHeader sortDirection={sortDirection}>STATUS</SortableColumnHeader>
              )}
            </Table.Column>
            <Table.Column id="pdf">PDF</Table.Column>
            <Table.Column className="text-end" id="actions">ACTIONS</Table.Column>
          </Table.Header>
          <Table.Body 
            items={contracts}
            renderEmptyState={() => (
              <div className="py-24 text-default-400 font-medium text-center w-full">
                No contracts defined
              </div>
            )}
          >
            {(item: any) => (
              <Table.Row key={item.id} id={item.id}>
                <Table.Cell>
                  {item.release?.name || item.title || "Untitled"}
                </Table.Cell>
                <Table.Cell>
                  {item.artist?.name || item.primaryArtistName || "Unknown"}
                </Table.Cell>
                <Table.Cell>
                  Artist: {Math.round(item.artistShare * 100)}% / Label: {Math.round(item.labelShare * 100)}%
                </Table.Cell>
                <Table.Cell>
                  {item._count?.earnings || 0} records
                </Table.Cell>
                <Table.Cell>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={item.status === "active" ? "success" : "default"}
                  >
                    {item.status}
                  </Chip>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    size="sm"
                    variant="tertiary"
                    onPress={() => window.open(`/api/files/contract/${item.id}`, '_blank')}
                  >
                    <FileText size={16} className="mr-2" />
                    View PDF
                  </Button>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="tertiary"
                      onPress={() => onEdit(item)}
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost" className="text-danger hover:bg-danger/10"
                      onPress={() => onDelete(item.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
