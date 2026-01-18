import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AIAssistantTab() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-center">AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Coming next: ask questions like “What are tonight’s peak hours?” or “Which tables turn over fastest?”
      </CardContent>
    </Card>
  );
}
