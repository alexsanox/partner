"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Plus, MessageSquare } from "lucide-react";

const mockTickets = [
  {
    id: "TKT-001",
    subject: "Server not starting after mod update",
    status: "OPEN",
    priority: "HIGH",
    createdAt: "May 8, 2026",
    lastReply: "2 hours ago",
  },
  {
    id: "TKT-002",
    subject: "Request for RAM upgrade",
    status: "RESOLVED",
    priority: "MEDIUM",
    createdAt: "May 3, 2026",
    lastReply: "3 days ago",
  },
];

const ticketStatusConfig: Record<
  string,
  { label: string; className: string }
> = {
  OPEN: {
    label: "Open",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  WAITING_REPLY: {
    label: "Waiting Reply",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
};

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Support</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create a ticket or check the status of existing requests
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Create Ticket */}
        <div className="lg:col-span-2">
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-lg font-semibold text-white">
                Open a Ticket
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <p className="text-xs text-blue-300">
                    The more information you provide, the quicker and more
                    helpful our support team can be.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Subject</Label>
                <Input
                  placeholder="Enter subject"
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  placeholder="Describe your issue"
                  rows={5}
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 resize-none"
                />
              </div>
              <Button className="w-full bg-blue-600 text-white hover:bg-blue-500">
                <Plus className="mr-2 h-4 w-4" />
                Submit
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        <div className="lg:col-span-3">
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-lg font-semibold text-white">My Tickets</h2>
            </CardHeader>
            <CardContent className="p-5">
              <Tabs defaultValue="open">
                <TabsList className="bg-white/5">
                  <TabsTrigger value="open">Open Tickets</TabsTrigger>
                  <TabsTrigger value="closed">Closed Tickets</TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="mt-4 space-y-3">
                  {mockTickets
                    .filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED")
                    .map((ticket) => {
                      const status =
                        ticketStatusConfig[ticket.status] ??
                        ticketStatusConfig.OPEN;
                      return (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/10"
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className="mt-0.5 h-4 w-4 text-slate-500" />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {ticket.subject}
                              </p>
                              <p className="text-xs text-slate-500">
                                {ticket.id} • {ticket.createdAt} • Last reply{" "}
                                {ticket.lastReply}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={status.className}
                          >
                            {status.label}
                          </Badge>
                        </div>
                      );
                    })}
                </TabsContent>
                <TabsContent value="closed" className="mt-4 space-y-3">
                  {mockTickets
                    .filter(
                      (t) => t.status === "RESOLVED" || t.status === "CLOSED"
                    )
                    .map((ticket) => {
                      const status =
                        ticketStatusConfig[ticket.status] ??
                        ticketStatusConfig.CLOSED;
                      return (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className="mt-0.5 h-4 w-4 text-slate-500" />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {ticket.subject}
                              </p>
                              <p className="text-xs text-slate-500">
                                {ticket.id} • {ticket.createdAt}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={status.className}
                          >
                            {status.label}
                          </Badge>
                        </div>
                      );
                    })}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
