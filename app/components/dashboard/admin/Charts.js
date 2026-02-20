import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const GoalProgress = ({ label, current, target, color }) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    const safeColor = color || 'var(--accent)';
    return (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#555' }}>{current.toLocaleString()} / {target.toLocaleString()}</span>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: safeColor }}>{percentage}%</span>
                </div>
            </div>
            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', background: safeColor, borderRadius: '2px' }}
                />
            </div>
        </div>
    );
};

export const ChartTooltip = ({ active, payload, label, color }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--surface)',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: '2px',
            padding: '16px 20px',
            boxShadow: '10px 10px 0 rgba(0,0,0,0.5)'
        }}>
            <div style={{ fontSize: '9px', color: '#555', fontWeight: '800', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ fontSize: '13px', fontWeight: '900', color: p.color || color || '#fff' }}>
                    ${Number(p.value).toLocaleString()}
                </div>
            ))}
        </div>
    );
};

export const RechartsAreaChart = ({ data, color = '#8b5cf6', height = 260 }) => {
    if (!data || data.length === 0) return (
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '11px', letterSpacing: '2px', fontWeight: '800' }}>
            NO DATA AVAILABLE
        </div>
    );

    return (
        <div style={{ width: '100%', height: `${height}px`, marginTop: '10px', minWidth: 0, minHeight: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: '#555', fontWeight: 700 }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                        tickFormatter={(v) => v?.includes?.('-') ? v.split('-')[1] : v}
                    />
                    <YAxis
                        tick={{ fontSize: 9, fill: '#555', fontWeight: 700 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                    />
                    <Tooltip content={<ChartTooltip color={color} />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2.5}
                        fill={`url(#gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
                        dot={{ r: 3, fill: '#0a0a0c', stroke: color, strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: color, stroke: '#0a0a0c', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export const DonutChart = ({ data }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const topItem = data.reduce((best, item) => (item.value > best.value ? item : best), data[0] || { label: 'TOTAL', value: 0, color: '#666' });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px', minWidth: 0, minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="label"
                            strokeWidth={0}
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 6px ${entry.color}55)` }} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div style={{
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '2px',
                                        padding: '12px 16px'
                                    }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}>{payload[0].name}</div>
                                        <div style={{ fontSize: '12px', fontWeight: '900', color: payload[0].payload.color }}>
                                            ${Number(payload[0].value).toLocaleString()} ({total ? Math.round((payload[0].value / total) * 100) : 0}%)
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>
                        {total ? `${Math.round((topItem.value / total) * 100)}%` : '0%'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: '900', letterSpacing: '1px' }}>{topItem.label}</div>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '150px' }}>
                {data.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '10px 1fr 36px', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: item.color }} />
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>{item.label}</div>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#777', textAlign: 'right' }}>
                            {total ? Math.round((item.value / total) * 100) : 0}%
                        </div>
                        <div style={{ gridColumn: '2 / 4', height: '4px', borderRadius: '1px', background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                            <div style={{ width: `${total ? Math.round((item.value / total) * 100) : 0}%`, height: '100%', background: item.color, transition: 'width 1s ease' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function pickPlatformColor(label) {
    const upper = (label || '').toUpperCase();
    if (upper.includes('SPOT')) return '#1DB954';
    if (upper.includes('APPLE')) return '#FA243C';
    if (upper.includes('YT') || upper.includes('YOU')) return '#FF0000';
    if (upper.includes('AMAZON')) return '#FF9900';
    if (upper.includes('TIDAL')) return '#00A0FF';
    if (upper.includes('DEEZER')) return '#A238FF';
    if (upper.includes('TIKTOK.')) return '#FE2C55';
    return '#777';
}
