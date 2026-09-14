export type StationId = string;
export type LineId = string;
export type VehicleId =
  | '115-yellow' | '213-marine' | '105-red' | 'kiha40-orange'
  | 'kiha120-mizurin' | 'hot7000' | 'ibara' | 'momo-tram' | 'n700-shinkansen';

export type SceneKind =
  | 'city' | 'suburb' | 'rural' | 'mountain' | 'tunnel'
  | 'bridge' | 'sea' | 'river' | 'street';

export type StationSpriteKind =
  | 'urban' | 'rural' | 'terminal' | 'tram-stop' | 'shinkansen' | 'unmanned';

export interface Station {
  readonly id: StationId;
  readonly kanji: string;
  /** 読み。入力判定の唯一のソース。ローマ字は engine が導出する。 */
  readonly kana: string;
  readonly pref: '岡山' | '兵庫' | '鳥取' | '広島' | '香川';
  /** 難読駅。難易度計算に使う。 */
  readonly rare?: boolean;
  readonly sprite?: StationSpriteKind;
  /** 停車時に出すトリビア。 */
  readonly note?: string;
  /** 読みの出典を確認済みか。 */
  readonly verified: boolean;
}

export interface Segment {
  readonly from: StationId;
  readonly to: StationId;
  /** 営業キロ。 */
  readonly km: number;
  readonly scene: SceneKind;
}

export interface Line {
  readonly id: LineId;
  readonly nameJp: string;
  readonly nameKana: string;
  readonly nickname?: string;
  readonly company: 'JR西日本' | '岡山電気軌道' | '水島臨海鉄道' | '井原鉄道' | '智頭急行';
  /** HUD・方向幕・切符の帯に使う路線カラー。 */
  readonly lineColor: string;
  readonly vehicle: VehicleId;
  readonly destination: string;
  readonly trainType: string;
  /** 起点→終点の順。 */
  readonly stops: readonly StationId[];
  readonly segments: readonly Segment[];
  readonly fareRule: string;
  readonly difficultyOverride?: number;
  readonly hideRomajiDefault?: boolean;
  readonly scopeNote?: string;
}
