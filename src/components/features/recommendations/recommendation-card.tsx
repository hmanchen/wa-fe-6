"use client";

import { Shield, ShieldCheck, Heart, Activity, Stethoscope, Pencil, Trash2 } from "lucide-react";
import type { InsuranceProduct, ProductType } from "@/types/recommendation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

const PRODUCT_TYPE_CONFIG: Record<
  ProductType,
  { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }
> = {
  "term-life": {
    label: "Term Life",
    icon: Shield,
    badgeClass: "border-blue-500/50 text-blue-600 dark:text-blue-400",
  },
  "whole-life": {
    label: "Whole Life",
    icon: ShieldCheck,
    badgeClass: "border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
  },
  "universal-life": {
    label: "Universal Life",
    icon: ShieldCheck,
    badgeClass: "border-teal-500/50 text-teal-600 dark:text-teal-400",
  },
  "critical-illness": {
    label: "Critical Illness",
    icon: Heart,
    badgeClass: "border-rose-500/50 text-rose-600 dark:text-rose-400",
  },
  disability: {
    label: "Disability",
    icon: Activity,
    badgeClass: "border-amber-500/50 text-amber-600 dark:text-amber-400",
  },
  health: {
    label: "Health",
    icon: Stethoscope,
    badgeClass: "border-violet-500/50 text-violet-600 dark:text-violet-400",
  },
};

export interface RecommendationCardProps {
  product: InsuranceProduct;
  onEdit: () => void;
  onRemove: () => void;
  className?: string;
}

export function RecommendationCard({ product, onEdit, onRemove, className }: RecommendationCardProps) {
  const config = PRODUCT_TYPE_CONFIG[product.type];
  const Icon = config.icon;

  const premiumDisplay =
    product.premiumFrequency === "monthly"
      ? `${formatCurrency(product.premium)}/mo`
      : `${formatCurrency(product.premium)}/yr`;

  const termDisplay = product.term ? `${product.term} years` : "Permanent";

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="font-semibold leading-tight">{product.productName}</h3>
              <p className="text-sm text-muted-foreground">{product.provider}</p>
              <Badge variant="outline" className={cn("w-fit text-xs", config.badgeClass)}>
                {config.label}
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit product">
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRemove}
              aria-label="Remove product"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4 pt-0">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Coverage</p>
            <p className="font-medium">{formatCurrency(product.coverageAmount)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Premium</p>
            <p className="font-medium">{premiumDisplay}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Term</p>
            <p className="font-medium">{termDisplay}</p>
          </div>
        </div>
        {product.features.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Key Features</p>
            <ul className="space-y-1 text-sm">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground">•</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      {product.notes && (
        <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
          <p className="line-clamp-2">{product.notes}</p>
        </CardFooter>
      )}
    </Card>
  );
}
