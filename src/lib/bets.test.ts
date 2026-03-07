import { describe, expect, it } from "vitest";
import {
	buildBetMetrics,
	calculateSettlementAmounts,
	parseTagInput,
} from "./bets";

describe("calculateSettlementAmounts", () => {
	it("calculates win correctly", () => {
		expect(calculateSettlementAmounts(100, 1.9, "win")).toEqual({
			grossReturn: 190,
			profit: 90,
		});
	});

	it("calculates loss correctly", () => {
		expect(calculateSettlementAmounts(100, 1.9, "loss")).toEqual({
			grossReturn: 0,
			profit: -100,
		});
	});

	it("calculates void correctly", () => {
		expect(calculateSettlementAmounts(100, 2.2, "void")).toEqual({
			grossReturn: 100,
			profit: 0,
		});
	});

	it("calculates half win correctly", () => {
		expect(calculateSettlementAmounts(100, 2, "half_win")).toEqual({
			grossReturn: 150,
			profit: 50,
		});
	});

	it("calculates half loss correctly", () => {
		expect(calculateSettlementAmounts(100, 2, "half_loss")).toEqual({
			grossReturn: 50,
			profit: -50,
		});
	});
});

describe("buildBetMetrics", () => {
	it("computes roi, win rate and streaks from settled bets", () => {
		const metrics = buildBetMetrics([
			{
				status: "win",
				stake: 100,
				profit: 90,
				settledAt: "2026-03-01T12:00:00.000Z",
			},
			{
				status: "half_win",
				stake: 100,
				profit: 40,
				settledAt: "2026-03-02T12:00:00.000Z",
			},
			{
				status: "loss",
				stake: 100,
				profit: -100,
				settledAt: "2026-03-03T12:00:00.000Z",
			},
			{
				status: "loss",
				stake: 100,
				profit: -100,
				settledAt: "2026-03-04T12:00:00.000Z",
			},
			{
				status: "void",
				stake: 100,
				profit: 0,
				settledAt: "2026-03-05T12:00:00.000Z",
			},
		]);

		expect(metrics.totalProfit).toBe(-70);
		expect(metrics.totalStake).toBe(500);
		expect(metrics.roi).toBeCloseTo(-0.14);
		expect(metrics.yield).toBeCloseTo(-0.14);
		expect(metrics.winRate).toBeCloseTo(0.4);
		expect(metrics.bestStreaks.green).toBe(2);
		expect(metrics.bestStreaks.red).toBe(2);
		expect(metrics.currentStreak).toBeNull();
	});
});

describe("parseTagInput", () => {
	it("normalizes comma separated tags", () => {
		expect(parseTagInput(" live, asian, live,  over ")).toEqual([
			"live",
			"asian",
			"over",
		]);
	});
});
