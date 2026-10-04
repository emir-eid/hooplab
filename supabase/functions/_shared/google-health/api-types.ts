// Google Health API v4 yanıtlarının kullandığımız kısmı. Alan adları resmi discovery belgesinden
// (https://health.googleapis.com/$discovery/rest?version=v4, revizyon 20261001) doğrulandı.
// int64 alanlar JSON'da dize olarak gelir (ör. "beatsPerMinute": "52"); double alanlar sayıdır.

export type Int64 = string | number;

export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

export interface CivilDateTime {
  date: CivilDate;
}

export interface SessionTimeInterval {
  startTime: string;
  endTime: string;
  startUtcOffset?: string;
  endUtcOffset?: string;
  civilStartTime?: CivilDateTime;
  civilEndTime?: CivilDateTime;
}

export interface DataSource {
  platform?: string;
}

export interface DailyHeartRateVariability {
  date: CivilDate;
  averageHeartRateVariabilityMilliseconds?: number;
  deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds?: number;
  entropy?: number;
  nonRemHeartRateBeatsPerMinute?: Int64;
}

export interface DailyRestingHeartRate {
  date: CivilDate;
  beatsPerMinute: Int64;
  dailyRestingHeartRateMetadata?: { calculationMethod?: string };
}

export interface DailyOxygenSaturation {
  date: CivilDate;
  averagePercentage?: number;
  lowerBoundPercentage?: number;
  upperBoundPercentage?: number;
}

export interface DailyRespiratoryRate {
  date: CivilDate;
  breathsPerMinute?: number;
}

export interface DailySleepTemperatureDerivations {
  date: CivilDate;
  nightlyTemperatureCelsius?: number;
  baselineTemperatureCelsius?: number;
}

export interface SleepStageSummary {
  type?: string;
  minutes?: Int64;
  count?: Int64;
}

export interface Sleep {
  interval: SessionTimeInterval;
  type?: string;
  metadata?: { mainSleep?: boolean; nap?: boolean; processed?: boolean };
  summary?: {
    minutesAsleep?: Int64;
    minutesAwake?: Int64;
    minutesInSleepPeriod?: Int64;
    minutesToFallAsleep?: Int64;
    minutesAfterWakeUp?: Int64;
    stagesSummary?: SleepStageSummary[];
  };
  shortAwakenings?: unknown[];
  updateTime?: string;
}

export interface Exercise {
  interval: SessionTimeInterval;
  exerciseType?: string;
  displayName?: string;
  activeDuration?: string;
  updateTime?: string;
  metricsSummary?: {
    caloriesKcal?: number;
    distanceMillimeters?: number;
    steps?: Int64;
    activeZoneMinutes?: Int64;
    averageHeartRateBeatsPerMinute?: Int64;
    heartRateZoneDurations?: {
      lightTime?: string;
      moderateTime?: string;
      vigorousTime?: string;
      peakTime?: string;
    };
  };
}

// list yanıtındaki veri noktası: tipine göre tek bir alan dolu.
export interface DataPoint {
  name?: string;
  dataSource?: DataSource;
  dailyHeartRateVariability?: DailyHeartRateVariability;
  dailyRestingHeartRate?: DailyRestingHeartRate;
  dailyOxygenSaturation?: DailyOxygenSaturation;
  dailyRespiratoryRate?: DailyRespiratoryRate;
  dailySleepTemperatureDerivations?: DailySleepTemperatureDerivations;
  sleep?: Sleep;
  exercise?: Exercise;
}

export interface ListDataPointsResponse {
  dataPoints?: DataPoint[];
  nextPageToken?: string;
}

// dailyRollUp yanıtındaki gün: tipine göre tek bir değer alanı dolu.
export interface DailyRollupDataPoint {
  civilStartTime?: CivilDateTime;
  civilEndTime?: CivilDateTime;
  heartRate?: { beatsPerMinuteMin?: number; beatsPerMinuteAvg?: number; beatsPerMinuteMax?: number };
  steps?: { countSum?: Int64 };
  distance?: { millimetersSum?: Int64 };
  totalCalories?: { kcalSum?: number };
  activeZoneMinutes?: {
    sumInFatBurnHeartZone?: Int64;
    sumInCardioHeartZone?: Int64;
    sumInPeakHeartZone?: Int64;
  };
}

export interface DailyRollUpDataPointsResponse {
  rollupDataPoints?: DailyRollupDataPoint[];
  nextPageToken?: string;
}

export interface Settings {
  timeZone?: string;
}

export interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}
