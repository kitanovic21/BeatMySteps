import { FlexWidget, TextWidget, type ColorProp, type HexColor } from 'react-native-android-widget';

import { formatSteps } from '@/utils/format';
import type { WidgetRow, WidgetSnapshot } from './data';

// Widgets can't read the app theme; these mirror src/theme for each system mode.
const PALETTES = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    muted: '#6B655C',
    track: '#E4DED2',
    second: '#ECEBE8',
    third: '#E4DED2',
    meRow: '#FEEFED',
  },
  dark: {
    background: '#151413',
    text: '#F6F4F1',
    muted: '#9B958C',
    track: '#2A2826',
    second: '#2A2826',
    third: '#2A2826',
    meRow: '#2E1C1A',
  },
} as const;
type Palette = (typeof PALETTES)[keyof typeof PALETTES];

const CORAL: HexColor = '#F95C4B';
const ON_CORAL: HexColor = '#000000';
const PADDING = 16;
const RADIUS = 24;

export const STEPS_WIDGET = 'Steps';
export const LEADERBOARD_WIDGET = 'Leaderboard';

/** Light and dark versions; Android picks one based on the system theme. */
export function renderWidget(name: string, data: WidgetSnapshot, width: number) {
  const Widget = name === LEADERBOARD_WIDGET ? LeaderboardWidget : StepsWidget;
  return {
    light: <Widget data={data} width={width} p={PALETTES.light} />,
    dark: <Widget data={data} width={width} p={PALETTES.dark} />,
  };
}

/** Plain fallback drawn if building a widget fails, so it never shows up blank. */
export function renderFallbackWidget() {
  return {
    light: <Fallback p={PALETTES.light} />,
    dark: <Fallback p={PALETTES.dark} />,
  };
}

function Fallback({ p }: { p: Palette }) {
  return (
    <Shell p={p} uri="beatmysteps://">
      <Header p={p} title="BeatMySteps" />
      <FlexWidget style={{ flex: 1, justifyContent: 'center', width: 'match_parent' }}>
        <TextWidget text="Tap to open the app" style={{ fontSize: 14, color: p.muted as ColorProp }} />
      </FlexWidget>
    </Shell>
  );
}

interface Props {
  data: WidgetSnapshot;
  width: number;
  p: Palette;
}

function Shell({ p, uri, children }: { p: Palette; uri: string; children: React.ReactNode }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: p.background as ColorProp,
        borderRadius: RADIUS,
        padding: PADDING,
        flexDirection: 'column',
      }}
    >
      {children}
    </FlexWidget>
  );
}

function Header({ p, title, right }: { p: Palette; title: string; right?: string }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <TextWidget text={title} style={{ fontSize: 13, fontWeight: '700', color: CORAL }} />
      {right ? <TextWidget text={right} style={{ fontSize: 12, color: p.muted as ColorProp }} /> : null}
    </FlexWidget>
  );
}

function SignedOut({ p }: { p: Palette }) {
  return (
    <Shell p={p} uri="beatmysteps://sign-in">
      <Header p={p} title="BeatMySteps" />
      <FlexWidget style={{ flex: 1, justifyContent: 'center', width: 'match_parent' }}>
        <TextWidget text="Sign in to see your steps" style={{ fontSize: 14, color: p.muted as ColorProp }} />
      </FlexWidget>
    </Shell>
  );
}

function StepsWidget({ data, width, p }: Props) {
  if (!data.signedIn) return <SignedOut p={p} />;
  const pct = data.goal > 0 ? Math.min(data.steps / data.goal, 1) : 0;
  const barWidth = Math.max(width - PADDING * 2, 0);
  const reached = data.steps >= data.goal;

  return (
    <Shell p={p} uri="beatmysteps://">
      <Header p={p} title="BeatMySteps" right="Today" />
      <FlexWidget style={{ flex: 1, justifyContent: 'center', width: 'match_parent' }}>
        <TextWidget
          text={formatSteps(data.steps)}
          style={{ fontSize: 36, fontWeight: '900', color: p.text as ColorProp }}
        />
        <TextWidget
          text={`of ${formatSteps(data.goal)} steps`}
          style={{ fontSize: 13, color: p.muted as ColorProp }}
        />
      </FlexWidget>
      <FlexWidget style={{ width: barWidth, height: 8, borderRadius: 4, backgroundColor: p.track as ColorProp }}>
        <FlexWidget
          style={{
            width: Math.max(Math.round(barWidth * pct), 8),
            height: 8,
            borderRadius: 4,
            backgroundGradient: { from: CORAL, to: '#FF8E6E', orientation: 'LEFT_RIGHT' },
          }}
        />
      </FlexWidget>
      <TextWidget
        text={
          reached
            ? 'Daily goal reached!'
            : `${Math.round(pct * 100)}% · ${formatSteps(data.goal - data.steps)} to go`
        }
        style={{ fontSize: 12, fontWeight: '600', color: (reached ? CORAL : p.muted) as ColorProp, marginTop: 6 }}
      />
    </Shell>
  );
}

function RankBadge({ rank, p }: { rank: number; p: Palette }) {
  const fill = rank === 1 ? CORAL : rank === 2 ? p.second : rank === 3 ? p.third : 'transparent';
  const color = rank === 1 ? ON_CORAL : rank === 2 ? p.text : p.muted;
  return (
    <FlexWidget
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: (fill === 'transparent' ? 'rgba(0, 0, 0, 0)' : fill) as ColorProp,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget text={String(rank)} style={{ fontSize: 12, fontWeight: '800', color: color as ColorProp }} />
    </FlexWidget>
  );
}

function Row({ row, p, label }: { row: WidgetRow; p: Palette; label?: string }) {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 12,
        backgroundColor: (row.isMe ? p.meRow : 'rgba(0, 0, 0, 0)') as ColorProp,
      }}
    >
      <RankBadge rank={row.rank} p={p} />
      <FlexWidget style={{ flex: 1, marginLeft: 10 }}>
        <TextWidget
          text={label ?? row.name}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 14, fontWeight: row.isMe ? '800' : '600', color: p.text as ColorProp }}
        />
      </FlexWidget>
      <TextWidget
        text={formatSteps(row.steps)}
        style={{ fontSize: 14, fontWeight: '800', color: p.text as ColorProp, marginLeft: 8 }}
      />
    </FlexWidget>
  );
}

function LeaderboardWidget({ data, p }: Props) {
  if (!data.signedIn) return <SignedOut p={p} />;
  const me = data.me;

  return (
    <Shell p={p} uri="beatmysteps://friends">
      <Header p={p} title="Leaderboard" right="Today" />
      {data.total <= 1 ? (
        <FlexWidget style={{ flex: 1, justifyContent: 'center', width: 'match_parent' }}>
          <TextWidget text="Add friends to compete" style={{ fontSize: 15, fontWeight: '700', color: p.text as ColorProp }} />
          <TextWidget text="Tap to open BeatMySteps" style={{ fontSize: 12, color: p.muted as ColorProp }} />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ flex: 1, width: 'match_parent', flexDirection: 'column', justifyContent: 'space-around' }}>
          {data.top.map((row) => (
            <Row key={row.rank} row={row} p={p} label={row.isMe ? `${row.name} (you)` : undefined} />
          ))}
          {me && (
            <FlexWidget style={{ width: 'match_parent', height: 1, backgroundColor: p.track as ColorProp }} />
          )}
          {me && <Row row={me} p={p} label={`You · #${me.rank} of ${data.total}`} />}
        </FlexWidget>
      )}
    </Shell>
  );
}
