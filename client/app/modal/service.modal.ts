export type Sentiment = "Positive" | "Mixed" | "Negative" | "NoReviews";

export type ApiResponse<TData = undefined> = {
  message?: string;
  status?: boolean;
  data?: TData;
};

export type Review = {
  _id?: string;
  author: string;
  username?: string;
  text: string;
  date: string;
  imageUrl?: string | null;
  likes?: number;
  liked?: boolean;
  userId?: string | null;
  replyCount?: number;
  replies?: ReviewReply[];
};

export type ReviewReply = {
  _id?: string;
  author: string;
  username?: string;
  text: string;
  date: string;
  imageUrl?: string | null;
  likes?: number;
  liked?: boolean;
  userId?: string | null;
  replyToType?: "review" | "reply";
  replyToId?: string;
  replyToUsername?: string;
};

export type RepliesPayload = {
  review?: Review;
  replies?: ReviewReply[];
};

export type PersonCredit = {
  id: string;
  name: string;
  imageUrl: string | null;
  professions: string[];
};

export type MovieInsight = {
  imdbId: string;
  type: string;
  title: string;
  year: string;
  releaseDate?: string;
  isReleased?: boolean;
  runtime: string;
  rating: string;
  language: string;
  country: string;
  ageRating: string;
  poster: string;
  backdrop: string;
  overview: string;
  genres: string[];
  cast: PersonCredit[];
  crew: PersonCredit[];
  summary: string;
  sentiment: Sentiment;
  confidence: number;
  reviews: Review[];
  communityReviews?: Review[];
};

export type MovieAiInsight = Pick<
  MovieInsight,
  | "imdbId"
  | "title"
  | "summary"
  | "sentiment"
  | "confidence"
  | "communityReviews"
>;

export type MovieSearchItem = {
  imdbId: string;
  title: string;
  year: string;
  poster: string;
  type: string;
};

export type AssistantSuggestion = MovieSearchItem;

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: AssistantSuggestion[];
};

export type ImdbApiPerson = {
  id?: string;
  displayName?: string;
  primaryImage?: { url?: string };
  primaryProfessions?: string[];
};

export type ImdbApiTitleResponse = {
  id?: string;
  type?: string;
  primaryTitle?: string;
  primaryImage?: { url?: string };
  startYear?: number;
  runtimeSeconds?: number;
  genres?: string[];
  rating?: { aggregateRating?: number };
  plot?: string;
  directors?: ImdbApiPerson[];
  writers?: ImdbApiPerson[];
  stars?: ImdbApiPerson[];
  originCountries?: Array<{ name?: string }>;
  spokenLanguages?: Array<{ name?: string }>;
};
