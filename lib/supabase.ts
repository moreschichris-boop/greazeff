import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);

export type Owner = {
  id: string;
  slug: string;
  name: string;
  team_name: string | null;
  photo_url: string | null;
  bio: string | null;
  questionnaire: { question: string; answer: string }[] | null;
  active: boolean;
  sort_order: number;
};

export type Season = {
  id: string;
  year: string;
  champion_id: string | null;
  runner_up_id: string | null;
  reg_season_winner_id: string | null;
  last_place_id: string | null;
  notes: string | null;
};

export type SeasonResult = {
  id: string;
  season_id: string;
  owner_id: string;
  wins: number;
  losses: number;
  ties: number;
  points_for: number | null;
  points_against: number | null;
  final_rank: number | null;
  made_playoffs: boolean;
};

export type RecordEntry = {
  id: string;
  title: string;
  holder_id: string | null;
  value: string | null;
  season_year: string | null;
  description: string | null;
  sort_order: number;
};

export type Photo = {
  id: string;
  season_year: string;
  url: string;
  caption: string | null;
  sort_order: number;
  media_type: "image" | "video";
};

export type RosterEntry = {
  id: string;
  season_id: string;
  owner_id: string;
  player_name: string;
  position: string | null;
  nfl_team: string | null;
  keeper_eligible: boolean;
  keeper_round: number | null;
  keeper_selected: boolean;
  is_free_agent: boolean;
  notes: string | null;
  sort_order: number;
};

export type FinanceEntry = {
  id: string;
  season_id: string;
  owner_id: string;
  entry_fee: number;
  faab_spend: number;
  loser_weeks: number;
  loser_penalty: number;
  winner_weeks: number;
  winner_bonus: number;
  amount_paid: number;
  notes: string | null;
};

export type SeasonPayout = {
  id: string;
  season_id: string;
  title: string;
  amount: number;
  owner_id: string | null;
  sort_order: number;
};

export type SeasonCost = {
  id: string;
  season_id: string;
  description: string;
  amount: number;
  paid_by_owner_id: string | null;
  sort_order: number;
};

export type WeeklyResult = {
  id: string;
  season_id: string;
  week: number;
  winner_owner_id: string | null;
  loser_owner_id: string | null;
};

export type ParlayPick = {
  id: string;
  season_id: string;
  week: number;
  owner_id: string;
  pick: string;
  odds: string | null;
  updated_at: string;
};

export type Draft = {
  id: string;
  season_id: string;
  rounds: number;
  draft_order: string[]; // owner ids, round-1 order
  status: "setup" | "in_progress" | "complete";
  current_pick: number;
  scheduled_at: string | null;
};

export type DraftPlayer = {
  id: string;
  season_year: string;
  name: string;
  position: string | null;
  nfl_team: string | null;
  rank: number | null;
  adp: number | null;
  bye_week: number | null;
  drafted: boolean;
};

export type DraftPick = {
  id: string;
  draft_id: string;
  pick_number: number;
  round: number;
  pick_in_round: number;
  owner_id: string;
  player_name: string;
  position: string | null;
  nfl_team: string | null;
  is_keeper: boolean;
};
