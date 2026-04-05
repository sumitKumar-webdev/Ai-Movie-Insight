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
  roles: string[];
  characters: string[];
};

export type NameProfile = {
  id: string;
  name: string;
  photo: string | null;
  backdrop: string | null;
  professions: string[];
  biography: string;
  birthDate: string | null;
  birthLocation: string | null;
  deathDate: string | null;
  deathLocation: string | null;
  isDeceased: boolean;
};

export type NameFilmographyItem = {
  id: string;
  categories: string[];
  characters: string[];
  episodeCount: number;
  title: {
    imdbId: string;
    type: string;
    title: string;
    poster: string | null;
    year: string;
    endYear: string | null;
    rating: number | null;
  };
};

export type NameFilmographyResponse = {
  credits: NameFilmographyItem[];
  totalCount: number;
  nextPageToken?: string;
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
  language: string | string[];
  country: string | string[];
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
  genres?: string[];
};

export type TitleSortBy =
  | "SORT_BY_POPULARITY"
  | "SORT_BY_RELEASE_DATE"
  | "SORT_BY_USER_RATING"
  | "SORT_BY_USER_RATING_COUNT"
  | "SORT_BY_YEAR";

export type TitleSortOrder = "ASC" | "DESC";

export type TitleType =
  | "MOVIE"
  | "TV_SERIES"
  | "TV_MINI_SERIES"
  | "TV_SPECIAL"
  | "TV_MOVIE"
  | "SHORT"
  | "VIDEO"
  | "VIDEO_GAME";

export type ListTitlesParams = {
  types?: TitleType[];
  genres?: string[];
  countryCodes?: string[];
  languageCodes?: string[];
  nameIds?: string[];
  interestIds?: string[];
  startYear?: number;
  endYear?: number;
  minVoteCount?: number;
  maxVoteCount?: number;
  minAggregateRating?: number;
  maxAggregateRating?: number;
  sortBy?: TitleSortBy;
  sortOrder?: TitleSortOrder;
  pageSize?: number;
  pageToken?: string;
};

export type ListTitlesState = {
  types: TitleType[];
  genres: string[];
  countryCodes: string[];
  languageCodes: string[];
  nameIds: string[];
  interestIds: string[];
  startYear: string;
  endYear: string;
  minVoteCount: string;
  maxVoteCount: string;
  minAggregateRating: string;
  maxAggregateRating: string;
  sortBy: TitleSortBy | "";
  sortOrder: TitleSortOrder | "";
  pageToken: string;
};

export type MovieTitleListResponse = {
  items: MovieSearchItem[];
  nextPageToken?: string;
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

export type ImdbApiCredit = {
  category?: string;
  characters?: string[];
  name?: ImdbApiPerson;
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
  credits?: ImdbApiCredit[];
  originCountries?: Array<{ name?: string }>;
  spokenLanguages?: Array<{ name?: string }>;
};
