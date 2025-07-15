"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowUpDown,
} from "lucide-react";

interface InformationItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  status?: "pending" | "completed" | "urgent" | "info";
  source?: string;
  type: "calendar" | "task" | "email" | "notification";
}

interface InformationPanelProps {
  title?: string;
  type?: "calendar" | "task" | "email" | "notification" | "all";
  items?: InformationItem[];
  onItemClick?: (item: InformationItem) => void;
  onFilterChange?: (filter: string) => void;
  onSortChange?: (sort: string) => void;
}

const InformationPanel = ({
  title = "Information Panel",
  type = "all",
  items = [
    {
      id: "1",
      title: "Weekly Team Meeting",
      description: "Discuss project progress and roadmap",
      date: "2023-06-15",
      time: "10:00 AM",
      status: "pending",
      source: "Google Calendar",
      type: "calendar",
    },
    {
      id: "2",
      title: "Complete Q2 Report",
      description: "Finalize quarterly performance metrics",
      date: "2023-06-18",
      status: "urgent",
      source: "Notion",
      type: "task",
    },
    {
      id: "3",
      title: "Client Proposal Review",
      description: "From: client@example.com",
      date: "2023-06-14",
      status: "pending",
      source: "Gmail",
      type: "email",
    },
    {
      id: "4",
      title: "New comment on your document",
      description: "Sarah commented on 'Project Plan'",
      date: "2023-06-15",
      time: "9:30 AM",
      source: "Notion",
      type: "notification",
    },
    {
      id: "5",
      title: "Submit expense report",
      description: "Monthly expense submission deadline",
      date: "2023-06-20",
      status: "pending",
      source: "Slack",
      type: "task",
    },
    {
      id: "6",
      title: "Marketing Strategy Meeting",
      description: "Review Q3 campaign plans",
      date: "2023-06-16",
      time: "2:00 PM",
      status: "pending",
      source: "Outlook Calendar",
      type: "calendar",
    },
  ],
  onItemClick = () => {},
  onFilterChange = () => {},
  onSortChange = () => {},
}: InformationPanelProps) => {
  const [activeTab, setActiveTab] = useState<string>(
    type !== "all" ? type : "calendar",
  );
  const [filterValue, setFilterValue] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onFilterChange(value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange(value);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(e.target.value);
  };

  const filteredItems = items.filter((item) => {
    // Filter by type if not on "all" tab
    if (activeTab !== "all" && item.type !== activeTab) return false;

    // Filter by search term
    if (
      filterValue &&
      !item.title.toLowerCase().includes(filterValue.toLowerCase()) &&
      !item.description?.toLowerCase().includes(filterValue.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "date") {
      return (a.date || "") > (b.date || "") ? -1 : 1;
    } else if (sortBy === "priority") {
      const priorityOrder = {
        urgent: 0,
        pending: 1,
        info: 2,
        completed: 3,
        undefined: 4,
      };
      return (
        priorityOrder[a.status as keyof typeof priorityOrder] -
        priorityOrder[b.status as keyof typeof priorityOrder]
      );
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "info":
        return <Badge>Info</Badge>;
      default:
        return null;
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "calendar":
        return <Calendar className="h-4 w-4 mr-2" />;
      case "task":
        return <CheckCircle2 className="h-4 w-4 mr-2" />;
      case "email":
        return <Mail className="h-4 w-4 mr-2" />;
      case "notification":
        return <MessageSquare className="h-4 w-4 mr-2" />;
      default:
        return <AlertCircle className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <Card className="w-full h-full bg-background shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                placeholder="Search..."
                className="w-[200px] h-8"
                value={filterValue}
                onChange={handleSearch}
              />
            </div>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[130px] h-8">
                <div className="flex items-center">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {type === "all" && (
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="calendar" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" /> Calendar
              </TabsTrigger>
              <TabsTrigger value="task" className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center">
                <Mail className="h-4 w-4 mr-2" /> Emails
              </TabsTrigger>
              <TabsTrigger value="notification" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" /> Notifications
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {sortedItems.length > 0 ? (
            sortedItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-md border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => onItemClick(item)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="mt-0.5">{getItemIcon(item.type)}</div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {getStatusBadge(item.status)}
                    {item.source && (
                      <span className="text-xs text-muted-foreground">
                        {item.source}
                      </span>
                    )}
                  </div>
                </div>
                {(item.date || item.time) && (
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    {item.date && (
                      <div className="flex items-center mr-3">
                        <Calendar className="h-3 w-3 mr-1" />
                        {item.date}
                      </div>
                    )}
                    {item.time && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.time}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-3">
                <Filter className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No items found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try changing your filters or search term
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InformationPanel;
