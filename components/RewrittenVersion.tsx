"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RewrittenVersion as RewrittenVersionType } from "@/types/report";
import { Copy, Check, FileEdit } from "lucide-react";
import { useState } from "react";

interface RewrittenVersionProps {
  version: RewrittenVersionType;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      className="h-7 text-xs"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="mr-1 h-3 w-3" />
          已复制
        </>
      ) : (
        <>
          <Copy className="mr-1 h-3 w-3" />
          复制
        </>
      )}
    </Button>
  );
}

export function RewrittenVersion({ version }: RewrittenVersionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileEdit className="h-4 w-4 text-slate-500" />
          低风险改写参考
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 标题 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              建议标题
            </span>
            <CopyButton text={version.title} />
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-sm font-medium text-slate-900">
              {version.title}
            </p>
          </div>
          <p className="text-xs text-slate-500">{version.titleReason}</p>
        </div>

        {/* 正文 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              建议正文
            </span>
            <CopyButton text={version.content} />
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-3 max-h-60 overflow-y-auto">
            <p className="text-sm text-slate-800 whitespace-pre-wrap">
              {version.content}
            </p>
          </div>
          <p className="text-xs text-slate-500">{version.contentReason}</p>
        </div>
      </CardContent>
    </Card>
  );
}
