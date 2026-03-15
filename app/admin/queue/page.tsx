"use client";

import * as React from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, MapPin, Globe, Loader2, RefreshCcw, Clock } from "lucide-react";
import Map, { Marker, NavigationControl, type MapRef, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PendingEvent {
  id: string;
  rawSource: string;
  suggestedTitle: string;
  suggestedDescription: string;
  status: string;
  createdAt: string;
  lng: number | null;
  lat: number | null;
}

export default function ModerationQueue() {
  const { theme } = useTheme();
  const { data: queue, mutate, isLoading } = useSWR<PendingEvent[]>("/api/admin/queue", fetcher);
  const [selected, setSelected] = React.useState<PendingEvent | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const mapRef = React.useRef<MapRef>(null);

  // Editable fields for the selected event
  const [editTitle, setEditTitle] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editPos, setEditPos] = React.useState<{ lng: number; lat: number } | null>(null);

  React.useEffect(() => {
    if (selected) {
      setEditTitle(selected.suggestedTitle || "");
      setEditDesc(selected.suggestedDescription || "");
      if (selected.lng && selected.lat) {
        setEditPos({ lng: selected.lng, lat: selected.lat });
      }
    }
  }, [selected]);

  const handlePublish = async () => {
    if (!selected || !editPos) return;
    setIsPublishing(true);
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          title: editTitle,
          description: editDesc,
          lng: editPos.lng,
          lat: editPos.lat,
          severity: "high" // Default for now
        }),
      });
      if (res.ok) {
        mutate();
        setSelected(null);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleMapClick = (e: MapLayerMouseEvent) => {
    setEditPos({ lng: e.lngLat.lng, lat: e.lngLat.lat });
  };

  // Grouping logic for the sidebar
  const groupedQueue = React.useMemo(() => {
    if (!queue) return {};
    const groups: Record<string, PendingEvent[]> = {};
    queue.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString("en-US", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [queue]);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 mt-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Intelligence Queue</h1>
            <p className="text-muted-foreground mt-1">Review AI-parsed data streams and verify locations.</p>
          </div>
          <Button variant="outline" onClick={() => mutate()} className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List Section */}
          <div className="lg:col-span-1 space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-10 gap-4 text-muted-foreground">
                <Loader2 className="animate-spin w-8 h-8" />
                <span>Syncing queue...</span>
              </div>
            )}
            
            {!isLoading && Object.entries(groupedQueue).map(([date, items]) => (
              <div key={date} className="space-y-3">
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md py-1">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-primary/60 border-b border-primary/20 pb-1">
                    {date === new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) ? "Today" : date}
                  </span>
                </div>
                {items.map((item) => (
                  <Card 
                    key={item.id} 
                    className={cn(
                      "p-4 cursor-pointer transition-all border-border/40 hover:border-primary/50",
                      selected?.id === item.id ? "ring-2 ring-primary border-transparent bg-primary/5" : "bg-card/50 backdrop-blur-sm"
                    )}
                    onClick={() => setSelected(item)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 overflow-hidden">
                        <h3 className="font-bold text-sm truncate">{item.suggestedTitle || "Review Needed"}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.rawSource}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] uppercase">Pending</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {item.lng ? "GEO-LOCATED" : "NO COORDS"}
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ))}

            {!isLoading && queue?.length === 0 && (
              <div className="text-center p-10 text-muted-foreground opacity-50">
                <p className="text-sm font-medium">Queue is empty</p>
              </div>
            )}
          </div>

          {/* Details & Map Section */}
          <div className="lg:col-span-2 space-y-6">
            {selected ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/40 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Refined Title</label>
                        <input 
                          className="w-full bg-background/50 border border-border/40 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Verification Summary</label>
                        <textarea 
                          className="w-full bg-background/50 border border-border/40 rounded-lg p-2 text-sm h-32 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground flex justify-between">
                        Spatial Verification 
                        <span className="text-primary font-mono">{editPos?.lat.toFixed(4)}, {editPos?.lng.toFixed(4)}</span>
                      </label>
                      <div className="h-[250px] rounded-xl overflow-hidden border border-border/40 relative">
                        <Map
                          ref={mapRef}
                          initialViewState={{
                            longitude: editPos?.lng || 31.1656,
                            latitude: editPos?.lat || 48.3794,
                            zoom: 12,
                          }}
                          onClick={handleMapClick}
                          mapStyle={theme === "dark" ? "https://tiles.openfreemap.org/styles/dark" : "https://tiles.openfreemap.org/styles/bright"}
                          style={{ width: "100%", height: "100%" }}
                        >
                          {editPos && (
                            <Marker longitude={editPos.lng} latitude={editPos.lat} anchor="bottom">
                              <MapPin className="text-primary fill-primary/20 w-8 h-8 -mt-8" />
                            </Marker>
                          )}
                          <NavigationControl position="top-right" />
                        </Map>
                        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold border border-border/40">
                           CLICK MAP TO RE-LOCATE PIN
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary/20 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Original Raw Intel</label>
                      <span className="text-[10px] text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs leading-relaxed italic text-muted-foreground/80">{selected.rawSource}</p>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border/20">
                    <Button 
                      className="flex-1 gap-2 h-12 rounded-xl text-lg font-bold"
                      onClick={handlePublish}
                      disabled={isPublishing}
                    >
                      {isPublishing ? <Loader2 className="animate-spin" /> : <Check className="w-5 h-5" />}
                      Approve & Publish Live
                    </Button>
                    <Button variant="destructive" className="h-12 w-12 rounded-xl flex items-center justify-center p-0">
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-3xl p-20 text-center space-y-4 opacity-50">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Select an entry</h3>
                  <p className="text-sm text-muted-foreground">Choose a raw report from the queue to start verification.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
