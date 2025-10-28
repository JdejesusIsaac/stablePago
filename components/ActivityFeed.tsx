import React from "react";
import { DepositButton } from "./common/DepositButton";
import Image from "next/image";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { Container } from "./common/Container";
import { useWallet } from "@crossmint/client-sdk-react-ui";

interface ActivityFeedProps {
  onDepositClick: () => void;
}

export function ActivityFeed({ onDepositClick }: ActivityFeedProps) {
  const { data, isLoading, error } = useActivityFeed();
  const { wallet } = useWallet();
  return (
    <div className="card-arc w-full max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Recent Activity</h2>
        <span className="text-sm font-medium text-text-secondary uppercase tracking-wide">Last 10</span>
      </div>
      <div
        className={`flex w-full flex-1 flex-col items-center ${isLoading || data?.events.length === 0 ? "justify-center min-h-[300px]" : "justify-start"}`}
      >
        {!isLoading && data?.events.length === 0 && (
          <div className="text-center max-w-md">
            <div className="mb-4 flex justify-center">
              <div className="rounded-2xl bg-surface-elevated border border-border p-6">
                <svg className="h-16 w-16 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="mb-3 text-lg font-bold text-foreground">
              No Activity Yet
            </h3>
            <p className="mb-8 text-sm text-text-secondary leading-relaxed">
              When you add, send and receive money it shows up here.
              <br />
              Get started by making your first deposit.
            </p>
            <button onClick={onDepositClick} className="btn-primary glow-primary">
              <span className="text-lg mr-2">+</span>
              Make Your First Deposit
            </button>
          </div>
        )}
        <div
          className={`flex w-full items-center ${isLoading || data?.events.length === 0 ? "justify-center" : "justify-start"}`}
        >
          {isLoading && (
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
          )}
          {error && (
            <div className="text-center">
              <div className="mb-2 text-error font-semibold">Error loading activity</div>
              <div className="text-sm text-text-muted">{error.message}</div>
            </div>
          )}
          {!isLoading && !error && data?.events?.length && data?.events?.length > 0 ? (
            <ul className="w-full space-y-2">
              {data?.events.slice(0, 10).map((event, index) => {
                const isOutgoing =
                  event.from_address.toLowerCase() === wallet?.address.toLowerCase();
                const counterparty = isOutgoing ? event.to_address : event.from_address;
                return (
                  <li 
                    key={`${event.transaction_hash}-${index}`} 
                    className="group flex items-center gap-4 p-4 rounded-xl bg-surface-elevated border border-border hover:border-border-hover transition-all duration-200 hover:scale-[1.01]"
                  >
                    {/* Icon Container with Arc Styling */}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${
                      isOutgoing 
                        ? 'bg-error/10 border border-error/30 group-hover:bg-error/20' 
                        : 'bg-success/10 border border-success/30 group-hover:bg-success/20'
                    }`}>
                      {isOutgoing ? (
                        <svg className="h-5 w-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Transaction Details */}
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground font-mono">
                        {counterparty.slice(0, 8)}...{counterparty.slice(-6)}
                      </div>
                      <div className="text-xs text-text-muted">
                        {new Date(event.timestamp).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        isOutgoing ? "text-negative" : "text-positive"
                      }`}>
                        {isOutgoing ? "-" : "+"}{Number(event.amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-text-muted font-medium">
                        {event.token_symbol || "USDC"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
