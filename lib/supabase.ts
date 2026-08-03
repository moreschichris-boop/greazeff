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
};

export type Draft = {
  id: string;
  season_id: string;
  rounds: number;
  draft_order: string[]; // owner ids, round-1 order
  status: "setup" | "in_progress" | "complete";
  current_pick: number;
};

export type DraftPlayer = {
  id: string;
  season_year: string;
  name: string;
  position: string | null;
  nfl_team: string | null;
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
