"use client";

import type { InsuranceProduct, ProductType } from "@/types/recommendation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  "term-life": "Term Life",
  "whole-life": "Whole Life",
  "universal-life": "Universal Life",
  "critical-illness": "Critical Illness",
  disability: "Disability",
  health: "Health",
};

export interface ProductComparisonProps {
  products: InsuranceProduct[];
  className?: string;
}

function getUniqueValues<T>(values: T[]): Set<T> {
  return new Set(values);
}

export function ProductComparison({ products, className }: ProductComparisonProps) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
        No products to compare. Add at least one recommendation.
      </div>
    );
  }

  const types = products.map((p) => p.type);
  const providers = products.map((p) => p.provider);
  const coverageAmounts = products.map((p) => p.coverageAmount);
  const premiums = products.map((p) => p.premium);
  const terms = products.map((p) => (p.term ? `${p.term}y` : "Permanent"));

  const typeSet = getUniqueValues(types);
  const providerSet = getUniqueValues(providers);
  const coverageSet = getUniqueValues(coverageAmounts);
  const premiumSet = getUniqueValues(premiums);
  const termSet = getUniqueValues(terms);

  return (
    <div className={cn("w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0", className)}>
      <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Attribute</TableHead>
              {products.map((product, i) => (
                <TableHead key={product.id} className="min-w-[180px]">
                  {product.productName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Type</TableCell>
              {products.map((product) => (
                <TableCell
                  key={product.id}
                  className={cn(
                    typeSet.size > 1 && "bg-amber-500/10 font-medium"
                  )}
                >
                  <Badge variant="outline" className="text-xs">
                    {PRODUCT_TYPE_LABELS[product.type]}
                  </Badge>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Provider</TableCell>
              {products.map((product) => (
                <TableCell
                  key={product.id}
                  className={cn(
                    providerSet.size > 1 && "bg-amber-500/10 font-medium"
                  )}
                >
                  {product.provider}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Coverage</TableCell>
              {products.map((product) => (
                <TableCell
                  key={product.id}
                  className={cn(
                    coverageSet.size > 1 && "bg-amber-500/10 font-medium"
                  )}
                >
                  {formatCurrency(product.coverageAmount)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Premium</TableCell>
              {products.map((product) => (
                <TableCell
                  key={product.id}
                  className={cn(
                    premiumSet.size > 1 && "bg-amber-500/10 font-medium"
                  )}
                >
                  {product.premiumFrequency === "monthly"
                    ? `${formatCurrency(product.premium)}/mo`
                    : `${formatCurrency(product.premium)}/yr`}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Term</TableCell>
              {products.map((product) => (
                <TableCell
                  key={product.id}
                  className={cn(
                    termSet.size > 1 && "bg-amber-500/10 font-medium"
                  )}
                >
                  {product.term ? `${product.term} years` : "Permanent"}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium align-top">Features</TableCell>
              {products.map((product) => (
                <TableCell key={product.id} className="align-top">
                  <ul className="space-y-0.5 text-sm">
                    {product.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                    {product.features.length === 0 && (
                      <li className="text-muted-foreground">—</li>
                    )}
                  </ul>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
    </div>
  );
}
