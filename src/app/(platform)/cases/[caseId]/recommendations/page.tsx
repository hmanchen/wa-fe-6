"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { CaseNav } from "@/components/layouts/case-nav";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RecommendationCard } from "@/components/features/recommendations/recommendation-card";
import { ProductComparison } from "@/components/features/recommendations/product-comparison";
import { FundingValidationDisplay } from "@/components/features/recommendations/funding-validation";
import { RecommendationNotes } from "@/components/features/recommendations/recommendation-notes";
import type {
  InsuranceProduct,
  FundingValidation,
  ProductType,
} from "@/types/recommendation";

const MOCK_PRODUCTS: InsuranceProduct[] = [
  {
    id: "prod-1",
    type: "term-life",
    provider: "Pacific Life",
    productName: "Pacific Term Select",
    coverageAmount: 500_000,
    premium: 125,
    premiumFrequency: "monthly",
    term: 20,
    features: [
      "Level premiums for 20 years",
      "Convertible to permanent life",
      "Accelerated underwriting available",
    ],
    notes: "Best fit for primary income replacement need",
  },
  {
    id: "prod-2",
    type: "critical-illness",
    provider: "Sun Life",
    productName: "Critical Illness Plus",
    coverageAmount: 100_000,
    premium: 85,
    premiumFrequency: "monthly",
    features: [
      "25 covered conditions",
      "Return of premium option",
      "Survivor benefit",
    ],
  },
];

const MOCK_VALIDATION: FundingValidation = {
  isAffordable: true,
  monthlyPremiumTotal: 210,
  incomePercentage: 4.2,
  maxRecommendedPercentage: 10,
  notes: "Total premium is within recommended guidelines.",
};

export default function RecommendationsPage() {
  const params = useParams();
  const caseId = params.caseId as string;
  const [products, setProducts] = useState<InsuranceProduct[]>(MOCK_PRODUCTS);
  const [validation] = useState<FundingValidation>(MOCK_VALIDATION);
  const [advisorNotes, setAdvisorNotes] = useState("");
  const [aiSummary, setAiSummary] = useState<string | undefined>();
  const [removeProductId, setRemoveProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const completedSteps = ["overview", "discovery", "analysis"];

  const handleRemoveProduct = (id: string) => setRemoveProductId(id);
  const handleConfirmRemove = () => {
    if (removeProductId) {
      setProducts((prev) => prev.filter((p) => p.id !== removeProductId));
      setRemoveProductId(null);
    }
  };

  const handleEditProduct = (id: string) => {
    // Placeholder: would open edit dialog/modal
    console.log("Edit product", id);
  };

  const handleAddProduct = () => {
    const newProduct: InsuranceProduct = {
      id: `prod-${crypto.randomUUID()}`,
      type: "term-life" as ProductType,
      provider: "New Provider",
      productName: "New Product",
      coverageAmount: 250_000,
      premium: 75,
      premiumFrequency: "monthly",
      term: 15,
      features: [],
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      // Would call API
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendForReview = async () => {
    setIsSending(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      // Would call API
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    setAiSummary(
      "Based on the client profile and needs analysis, this recommendation package addresses income replacement ($500K term life), critical illness protection ($100K), and maintains affordability within 5% of household income. The staggered implementation allows the client to prioritize core coverage first."
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <CaseNav
        caseId={caseId}
        currentStep="recommendations"
        completedSteps={completedSteps}
      />

      <PageHeader
        title="Recommendations"
        description="Review and configure insurance product recommendations for this case"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button variant="outline" onClick={handleSendForReview} disabled={isSending}>
            {isSending ? "Sending..." : "Send for Review"}
          </Button>
          <Button asChild>
            <Link href={`/cases/${caseId}/report`}>
              <FileText className="size-4" />
              Generate Report
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <div>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Product Recommendations</h2>
            <Button size="sm" onClick={handleAddProduct}>
              <Plus className="size-4" />
              Add Product
            </Button>
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No products added"
              description="Add insurance products to build your recommendation package for this case."
              action={
                <Button onClick={handleAddProduct}>
                  <Plus className="size-4" />
                  Add First Product
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => (
                <RecommendationCard
                  key={product.id}
                  product={product}
                  onEdit={() => handleEditProduct(product.id)}
                  onRemove={() => handleRemoveProduct(product.id)}
                />
              ))}
            </div>
          )}
        </div>

        <FundingValidationDisplay validation={validation} />

        <Tabs defaultValue="comparison">
          <TabsList>
            <TabsTrigger value="comparison">Compare Products</TabsTrigger>
            <TabsTrigger value="notes">Advisor Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="comparison" className="mt-4">
            <ProductComparison products={products} />
          </TabsContent>
          <TabsContent value="notes" className="mt-4">
            <RecommendationNotes
              notes={advisorNotes}
              onChange={setAdvisorNotes}
              aiSummary={aiSummary}
              onGenerateAiSummary={handleGenerateAiSummary}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={!!removeProductId}
        onOpenChange={(open) => !open && setRemoveProductId(null)}
        title="Remove Product"
        description="Are you sure you want to remove this product from the recommendation? This action cannot be undone."
        onConfirm={handleConfirmRemove}
        confirmText="Remove"
        variant="destructive"
      />
    </div>
  );
}
