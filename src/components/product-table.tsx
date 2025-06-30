// src/components/product-table.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MoreHorizontal,
  FilePenLine,
  Trash2,
  Send,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

import type { Product } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "./ui/progress";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onSubmitForReview: (id: string) => void;
  onRecalculateScore: (id: string) => void;
}

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onSubmitForReview,
  onRecalculateScore,
}: ProductTableProps) {
  const getStatusVariant = (status: Product["status"]) => {
    switch (status) {
      case "Published":
        return "default";
      case "Draft":
        return "secondary";
      case "Archived":
        return "outline";
      default:
        return "outline";
    }
  };

  const getVerificationVariant = (status?: Product["verificationStatus"]) => {
    switch (status) {
      case "Verified":
        return "default";
      case "Pending":
        return "secondary";
      case "Failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Image</TableHead>
          <TableHead>Product Name</TableHead>
          <TableHead>ESG Score</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Verification</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <Image
                src={product.productImage}
                alt={product.productName}
                width={40}
                height={40}
                className="rounded-md"
                data-ai-hint="product photo"
              />
            </TableCell>
            <TableCell className="font-medium">
              <Link
                href={`/products/${product.id}`}
                className="hover:underline"
                target="_blank"
              >
                {product.productName}
              </Link>
            </TableCell>
            <TableCell>
              {product.esg?.score !== undefined ? (
                <div
                  className="flex items-center gap-2"
                  title={product.esg.summary}
                >
                  <Progress value={product.esg.score} className="w-20 h-2" />
                  <span>{product.esg.score}/100</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  Pending...
                </span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(product.status)}>
                {product.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={getVerificationVariant(product.verificationStatus)}
              >
                {product.verificationStatus ?? "Not Submitted"}
              </Badge>
            </TableCell>
            <TableCell>
              {format(new Date(product.lastUpdated), "PPP")}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onRecalculateScore(product.id)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recalculate Score
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSubmitForReview(product.id)}
                    disabled={
                      product.status !== "Draft" ||
                      product.verificationStatus === "Pending"
                    }
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit for Review
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the passport for "{product.productName}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(product.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
