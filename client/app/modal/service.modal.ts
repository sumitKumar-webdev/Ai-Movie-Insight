export type Sentiment = "Positive" | "Mixed" | "Negative" | "NoReviews";

export type ApiResponse<TData = undefined> = {
  message?: string;
  status?: boolean;
  data?: TData;
};

export type ReviewUser = {
  id?: string | null;
  name: string;
  username?: string;
  imageUrl?: string | null;
  isVerified?: boolean;
};

export type Review = {
  _id?: string;
  user: ReviewUser;
  text: string;
  date: string;
  likeCount: number;
  likedByUser?: boolean;
  commentCount: number;
  replies?: ReviewReply[];
  movie: {
    imdbId: string;
    title: string;
  };
  movieYear?: string;
  movieType?: string;
  posterUrl?: string;
};

export type ReviewReply = {
  _id?: string;
  user: ReviewUser;
  text: string;
  date: string;
  likeCount: number;
  likedByUser?: boolean;
  replyToType?: "review" | "reply";
  replyToId?: string;
  replyToUsername?: string;
};

export type ReviewShareCardPayload = {
  id: string;
  user: {
    id?: string | null;
    username: string;
    name: string;
    imageUrl?: string | null;
    isVerified?: boolean;
  };
  content: {
    imdbId: string;
    title: string;
    posterUrl: string;
    year: string;
    type: string;
    backdropUrl?: string;
  };
  text: string;
  likeCount: number;
  commentCount: number;
  likedByUser?: boolean;
  createdAt: string;
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

export type MovieDetails = {
  imdbId: string;
  type: string;
  title: string;
  year: string;
  releaseDate?: string;
  isReleased?: boolean;
  runtime: string;
  rating: string;
  ratingCount?: number;
  language: string;
  country: string;
  ageRating: string;
  poster: string;
  backdrop: string;
  overview: string;
  genres: string[];
  cast: PersonCredit[];
  crew: PersonCredit[];
};

export type MovieAiInsight = {
  imdbId: string;
  title: string;
  summary: string;
  sentiment: Sentiment;
  confidence: number;
};

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
  rating?: { aggregateRating?: number; voteCount?: number };
  plot?: string;
  directors?: ImdbApiPerson[];
  writers?: ImdbApiPerson[];
  stars?: ImdbApiPerson[];
  originCountries?: Array<{ name?: string }>;
  spokenLanguages?: Array<{ name?: string }>;
};
