"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AlertCircle, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const accuracyData = [
  { date: "Mon", accuracy: 92, responseTime: 1.2 },
  { date: "Tue", accuracy: 94, responseTime: 1.1 },
  { date: "Wed", accuracy: 91, responseTime: 1.3 },
  { date: "Thu", accuracy: 95, responseTime: 1.0 },
  { date: "Fri", accuracy: 93, responseTime: 1.2 },
  { date: "Sat", accuracy: 96, responseTime: 0.9 },
  { date: "Sun", accuracy: 94, responseTime: 1.1 },
]

const recommendationData = [
  { category: "Vocabulary", accuracy: 96, coverage: 94 },
  { category: "Grammar", accuracy: 91, coverage: 88 },
  { category: "Listening", accuracy: 89, coverage: 85 },
  { category: "Speaking", accuracy: 87, coverage: 82 },
  { category: "Reading", accuracy: 93, coverage: 90 },
]

const feedbackAnalysis = [
  { type: "Positive", count: 245, percentage: 72 },
  { type: "Neutral", count: 65, percentage: 19 },
  { type: "Negative", count: 25, percentage: 7 },
  { type: "Suggestion", count: 12, percentage: 3 },
]

const performanceMetrics = [
  { metric: "Overall Accuracy", value: "93.5%", trend: "+2.1%", status: "good" },
  { metric: "Avg Response Time", value: "1.1s", trend: "-0.2s", status: "good" },
  { metric: "User Satisfaction", value: "4.2/5", trend: "+0.3", status: "good" },
  { metric: "Recommendation Coverage", value: "87.8%", trend: "+1.5%", status: "good" },
]

const recentRecommendations = [
  {
    id: 1,
    user: "John Doe",
    recommendation: "Vocabulary Quiz - Advanced",
    accuracy: "95%",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    user: "Jane Smith",
    recommendation: "Grammar Practice - Intermediate",
    accuracy: "88%",
    timestamp: "3 hours ago",
  },
  {
    id: 3,
    user: "Mike Johnson",
    recommendation: "Listening Exercise - Beginner",
    accuracy: "92%",
    timestamp: "4 hours ago",
  },
  {
    id: 4,
    user: "Sarah Williams",
    recommendation: "Speaking Challenge - Intermediate",
    accuracy: "85%",
    timestamp: "5 hours ago",
  },
]

export default function AIPerformancePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Performance</h1>
        <p className="text-muted-foreground mt-2">Monitor AI recommendations and feedback accuracy</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric) => (
          <Card key={metric.metric} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.metric}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                  <p className="text-xs text-primary mt-2">{metric.trend} from last week</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert */}
      <Alert className="bg-primary/10 border-primary/30">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          AI system is performing optimally. All metrics are within expected ranges. Last system update: 2 hours ago.
        </AlertDescription>
      </Alert>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Accuracy Trend</CardTitle>
            <CardDescription>Weekly AI recommendation accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                accuracy: { label: "Accuracy %", color: "#00d9ff" },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3a52" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[80, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#00d9ff"
                    strokeWidth={2}
                    dot={{ fill: "#00d9ff" }}
                    name="Accuracy %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Category Performance</CardTitle>
            <CardDescription>Accuracy by learning category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                accuracy: { label: "Accuracy", color: "#00d9ff" },
                coverage: { label: "Coverage", color: "#7c3aed" },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recommendationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3a52" />
                  <XAxis dataKey="category" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#00d9ff" name="Accuracy %" />
                  <Bar dataKey="coverage" fill="#7c3aed" name="Coverage %" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger
            value="recommendations"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Recent Recommendations
          </TabsTrigger>
          <TabsTrigger
            value="feedback"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Feedback Analysis
          </TabsTrigger>
        </TabsList>

        {/* Recent Recommendations */}
        <TabsContent value="recommendations" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent AI Recommendations</CardTitle>
              <CardDescription>Latest recommendations made by the AI system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-foreground">User</TableHead>
                      <TableHead className="text-foreground">Recommendation</TableHead>
                      <TableHead className="text-foreground">Accuracy</TableHead>
                      <TableHead className="text-foreground">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecommendations.map((rec) => (
                      <TableRow key={rec.id} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-medium text-foreground">{rec.user}</TableCell>
                        <TableCell className="text-muted-foreground">{rec.recommendation}</TableCell>
                        <TableCell>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                            {rec.accuracy}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{rec.timestamp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Analysis */}
        <TabsContent value="feedback" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Feedback Analysis</CardTitle>
              <CardDescription>User feedback sentiment distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedbackAnalysis.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-medium">{item.type}</span>
                      <span className="text-muted-foreground">{item.count} responses</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.type === "Positive"
                            ? "bg-primary"
                            : item.type === "Neutral"
                              ? "bg-accent"
                              : item.type === "Negative"
                                ? "bg-destructive"
                                : "bg-muted-foreground"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.percentage}% of total feedback</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
