import React from 'react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { Wifi, WifiOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

/**
 * Компонент для отображения статуса синхронизации данных
 */
const SyncStatusIndicator = () => {
  const { isOnline, pendingCount, hasPendingSync, startSync } = useSyncStatus();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={isOnline ? "outline" : "secondary"} className="flex gap-1 items-center cursor-pointer hover:bg-secondary/50">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          
          {hasPendingSync && (
            <>
              {isOnline ? (
                <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
              ) : (
                <span className="text-xs text-yellow-500">{pendingCount}</span>
              )}
            </>
          )}
          
          {isOnline && !hasPendingSync && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="p-3">
        <div className="text-sm space-y-2">
          <div className="font-semibold">
            {isOnline ? 'Онлайн' : 'Оффлайн'}
          </div>
          {hasPendingSync && (
            <div>
              {pendingCount} {pendingCount === 1 ? 'запись ожидает' : 'записей ожидают'} синхронизации
            </div>
          )}
          {isOnline && hasPendingSync && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={startSync}
            >
              Синхронизировать сейчас
            </Button>
          )}
          {isOnline && !hasPendingSync && (
            <div className="text-muted-foreground">Все данные синхронизированы</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default SyncStatusIndicator; 