import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Message } from '../types';

interface ThoughtNetworkProps {
  messages: Message[];
  theme: 'light' | 'dark';
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  radius: number;
  wordCount: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
}

// Simple heuristic to extract key terms
const extractEntities = (text: string): string[] => {
  if (!text) return [];
  const words = text.split(/[\s.,!?()\[\]{}"':;]+/).filter(Boolean);
  const entities = new Map<string, number>();
  
  words.forEach(w => {
    if (w.length < 5) return; // skip short words
    // Prefer words that start with uppercase, but accept long words too
    const isCapitalized = /^[A-ZÜĞŞİÖÇ]/.test(w);
    const normalized = w.toLowerCase();
    
    // Skip very common stop words (a basic list)
    const stopWords = ['the', 'and', 'for', 'with', 'this', 'that', 'you', 'are', 'not', 'but', 'what', 'have', 'from', 'they', 'we', 'will', 'bir', 'bu', 've', 'için', 'ile', 'ama', 'çok', 'gibi', 'daha', 'var', 'yok', 'olan', 'olarak', 'kadar', 'bunu', 'veya', 'neden', 'nasıl', 'hangi', 'tüm', 'her', 'da', 'de', 'ki', 'mı', 'mi', 'mu', 'mü'];
    if (stopWords.includes(normalized)) return;

    if (w.length > 6 || isCapitalized) {
      entities.set(normalized, (entities.get(normalized) || 0) + 1);
    }
  });

  // Return top entities
  return Array.from(entities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(e => e[0]);
};

export const ThoughtNetwork: React.FC<ThoughtNetworkProps> = ({ messages, theme }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries.length > 0) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || messages.length === 0 || dimensions.width === 0) return;

    // Build graph data
    const nodesMap = new Map<string, Node>();
    const linksMap = new Map<string, Link>();

    messages.forEach(msg => {
      const entities = extractEntities(msg.text);
      entities.forEach((entity, i) => {
        if (!nodesMap.has(entity)) {
          nodesMap.set(entity, { 
            id: entity, 
            group: msg.role === 'user' ? 1 : 2, 
            radius: 12,
            wordCount: 1
          });
        } else {
          const n = nodesMap.get(entity)!;
          n.wordCount++;
          n.radius = Math.min(30, 12 + n.wordCount * 2);
        }

        // Create links between entities in the same message
        for (let j = i + 1; j < entities.length; j++) {
          const target = entities[j];
          const linkId = [entity, target].sort().join('-');
          if (!linksMap.has(linkId)) {
            linksMap.set(linkId, { source: entity, target, value: 1 });
          } else {
            linksMap.get(linkId)!.value += 1;
          }
        }
      });
    });

    const nodes = Array.from(nodesMap.values());
    const links = Array.from(linksMap.values());

    if (nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => (d as Node).radius + 10));

    // Colors
    const linkColor = theme === 'dark' ? '#3f3f46' : '#e4e4e7';
    const textColor = theme === 'dark' ? '#a1a1aa' : '#52525b';
    const userNodeColor = '#3b82f6'; // blue
    const modelNodeColor = theme === 'dark' ? '#71717a' : '#a1a1aa'; // zinc

    const link = svg.append("g")
      .attr("stroke", linkColor)
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    nodeGroup.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.group === 1 ? userNodeColor : modelNodeColor)
      .attr("stroke", theme === 'dark' ? '#000' : '#fff')
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.8);

    nodeGroup.append("text")
      .text(d => d.id)
      .attr("x", d => d.radius + 5)
      .attr("y", 3)
      .attr("fill", textColor)
      .style("font-size", "10px")
      .style("font-family", "Inter, sans-serif")
      .style("font-weight", "500")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      nodeGroup
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [messages, dimensions, theme]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {messages.length < 2 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 opacity-50 p-6 text-center">
          <div className="w-16 h-16 rounded-full border border-dashed border-zinc-500/30 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <p className="text-sm font-medium">Zihin haritası için sohbete başlayın.</p>
          <p className="text-xs max-w-[200px] mt-2">Düşünceleriniz bağlandıkça burada bir ağ oluşacak.</p>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default ThoughtNetwork;
