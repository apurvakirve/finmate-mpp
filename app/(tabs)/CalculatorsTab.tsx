import { Feather as Icon, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, SegmentedButtons, useTheme } from 'react-native-paper';
import { CalculatorCard } from '../../components/calculator/CalculatorCard';
import { PieChartView } from '../../components/calculator/PieChartView';
import { ResultCard } from '../../components/calculator/ResultCard';
import { SliderInput } from '../../components/calculator/SliderInput';
import { AIStudioTheme } from '../../constants/aiStudioTheme';
import { calculators, calculatorTheme } from '../../constants/calculatorTheme';

type CalculatorId = 'dashboard' | 'sip' | 'compareSip' | 'swp' | 'stp' | 'retirement' | 'fd' | 'rd' | 'ppf' | 'interest' | 'currency' | 'stock';

export default function CalculatorsTab() {
    const theme = useTheme();
    const [activeCalculator, setActiveCalculator] = useState<CalculatorId>('dashboard');

    // --- Calculator States (Initialized to 0) ---

    // 1. SIP
    const [sipMonthly, setSipMonthly] = useState(0);
    const [sipRate, setSipRate] = useState(0);
    const [sipYears, setSipYears] = useState(0);
    const [sipResult, setSipResult] = useState({ total: 0, invested: 0, returns: 0 });

    // 2. FD
    const [fdP, setFdP] = useState(0);
    const [fdR, setFdR] = useState(0);
    const [fdT, setFdT] = useState(0);
    const [fdComp, setFdComp] = useState('quarterly');
    const [fdResult, setFdResult] = useState({ total: 0, interest: 0 });

    // 3. SWP
    const [swpP, setSwpP] = useState(0);
    const [swpW, setSwpW] = useState(0);
    const [swpR, setSwpR] = useState(0);
    const [swpT, setSwpT] = useState(0);
    const [swpResult, setSwpResult] = useState({ remaining: 0, withdrawn: 0 });

    // 4. STP
    const [stpSP, setStpSP] = useState(0);
    const [stpM, setStpM] = useState(0);
    const [stpSR, setStpSR] = useState(0);
    const [stpTR, setStpTR] = useState(0);
    const [stpT, setStpT] = useState(0);
    const [stpResult, setStpResult] = useState({ total: 0, target: 0, source: 0 });

    // 5. Retirement
    const [retCA, setRetCA] = useState(0); 
    const [retRA, setRetRA] = useState(0);
    const [retE, setRetE] = useState(0);
    const [retI, setRetI] = useState(0);
    const [retR, setRetR] = useState(0);
    const [retLX, setRetLX] = useState(0);
    const [retResult, setRetResult] = useState({ corpus: 0, sip: 0 });


    // 6. Compare SIP
    const [cSipM1, setCSipM1] = useState(0);
    const [cSipR1, setCSipR1] = useState(0);
    const [cSipY1, setCSipY1] = useState(0);
    const [cSipM2, setCSipM2] = useState(0);
    const [cSipR2, setCSipR2] = useState(0);
    const [cSipY2, setCSipY2] = useState(0);
    const [cSipResult, setCSipResult] = useState({ t1: 0, t2: 0, diff: 0, better: '' });
    const [showComparison, setShowComparison] = useState(false);

    // 7. PPF
    const [ppfD, setPpfD] = useState(0);
    const [ppfR, setPpfR] = useState(7.1); 
    const [ppfT, setPpfT] = useState(15); 
    const [ppfResult, setPpfResult] = useState({ total: 0, deposited: 0, interest: 0 });

    // 8. RD
    const [rdM, setRdM] = useState(0);
    const [rdR, setRdR] = useState(0);
    const [rdT, setRdT] = useState(0);
    const [rdResult, setRdResult] = useState({ total: 0, deposited: 0, interest: 0 });

    // 9. Interest
    const [intP, setIntP] = useState(0);
    const [intR, setIntR] = useState(0);
    const [intT, setIntT] = useState(0);
    const [intTy, setIntTy] = useState('compound');
    const [intResult, setIntResult] = useState({ total: 0, interest: 0 });

    // 10. Currency
    const [curA, setCurA] = useState(0);
    const [curR, setCurR] = useState(0);
    const [curRes, setCurRes] = useState(0);

    // 11. Stock
    const [stkB, setStkB] = useState(0);
    const [stkS, setStkS] = useState(0);
    const [stkQ, setStkQ] = useState(0);
    const [stkBr, setStkBr] = useState(0);
    const [stkResult, setStkResult] = useState({ profit: 0, roi: 0, investment: 0 });

    // --- Calculation Effects ---

    useEffect(() => {
        if (sipMonthly <= 0 || sipRate <= 0 || sipYears <= 0) {
            setSipResult({ total: 0, invested: 0, returns: 0 });
            return;
        }
        const i = sipRate / 12 / 100;
        const months = sipYears * 12;
        const total = sipMonthly * (Math.pow(1 + i, months) - 1) * (1 + i) / i;
        const invested = sipMonthly * months;
        setSipResult({ total, invested, returns: total - invested });
    }, [sipMonthly, sipRate, sipYears]);

    useEffect(() => {
        if (fdP <= 0 || fdR <= 0 || fdT <= 0) {
            setFdResult({ total: 0, interest: 0 });
            return;
        }
        const r = fdR / 100;
        let n = 4;
        if (fdComp === 'monthly') n = 12;
        if (fdComp === 'quarterly') n = 4;
        if (fdComp === 'yearly') n = 1;
        const total = fdP * Math.pow(1 + r / n, n * fdT);
        setFdResult({ total, interest: total - fdP });
    }, [fdP, fdR, fdT, fdComp]);

    useEffect(() => {
        if (swpP <= 0 || swpW <= 0 || swpT <= 0) {
            setSwpResult({ remaining: 0, withdrawn: 0 });
            return;
        }
        let corpus = swpP;
        const mRate = swpR / 12 / 100;
        const months = swpT * 12;
        let withdrawn = 0;
        for (let i = 0; i < months; i++) {
            corpus = corpus * (1 + mRate) - swpW;
            withdrawn += swpW;
            if (corpus <= 0) { corpus = 0; break; }
        }
        setSwpResult({ remaining: Math.max(0, corpus), withdrawn });
    }, [swpP, swpW, swpR, swpT]);

    useEffect(() => {
        if (stpSP <= 0 || stpM <= 0 || stpT <= 0) {
            setStpResult({ total: 0, target: 0, source: 0 });
            return;
        }
        let s = stpSP; let t = 0;
        const sR = stpSR / 12 / 100;
        const tR = stpTR / 12 / 100;
        const m = stpT * 12;
        for (let i = 0; i < m; i++) {
            s = s * (1 + sR) - stpM;
            t = (t + stpM) * (1 + tR);
            if (s <= 0) { s = 0; break; }
        }
        setStpResult({ total: s + t, target: t, source: s });
    }, [stpSP, stpM, stpSR, stpTR, stpT]);

    useEffect(() => {
        if (retE <= 0 || retR <= 0 || retLX <= retRA) {
            setRetResult({ corpus: 0, sip: 0 });
            return;
        }
        const yTR = retRA - retCA;
        const yIR = retLX - retRA;
        const futureExp = retE * Math.pow(1 + retI / 100, yTR);
        const mRR = retR / 12 / 100;
        const mIR = retI / 12 / 100;
        const realR = (mRR - mIR) / (1 + mIR);
        const mIRet = yIR * 12;
        const corp = futureExp * ((1 - Math.pow(1 + realR, -mIRet)) / realR);
        const mTR = yTR * 12;
        const sipR = retR / 12 / 100;
        const sip = corp * sipR / ((Math.pow(1 + sipR, mTR) - 1) * (1 + sipR));
        setRetResult({ corpus: corp, sip });
    }, [retCA, retRA, retE, retI, retR, retLX]);

    const handleCompareSIP = () => {
        const calc = (P: number, r: number, y: number) => {
            if (P <= 0 || r <= 0 || y <= 0) return 0;
            const i = r / 12 / 100; const m = y * 12;
            return P * (Math.pow(1 + i, m) - 1) * (1 + i) / i;
        };
        const t1 = calc(cSipM1, cSipR1, cSipY1);
        const t2 = calc(cSipM2, cSipR2, cSipY2);
        const diff = Math.abs(t1 - t2);
        let better = '';
        if (t1 > t2) better = 'SIP 1';
        else if (t2 > t1) better = 'SIP 2';
        else better = 'Both are equal';

        setCSipResult({ t1, t2, diff, better });
        setShowComparison(true);
    };

    useEffect(() => {
        if (ppfD <= 0 || ppfT <= 0) {
            setPpfResult({ total: 0, deposited: 0, interest: 0 });
            return;
        }
        const r = ppfR / 100;
        const M = ppfD * ((Math.pow(1 + r, ppfT) - 1) / r);
        const dep = ppfD * ppfT;
        setPpfResult({ total: M, deposited: dep, interest: M - dep });
    }, [ppfD, ppfR, ppfT]);

    useEffect(() => {
        if (rdM <= 0 || rdR <= 0 || rdT <= 0) {
            setRdResult({ total: 0, deposited: 0, interest: 0 });
            return;
        }
        const r = rdR / 100; const n = rdT * 12;
        const i = r / 12;
        const M = rdM * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        const dep = rdM * n;
        setRdResult({ total: M, deposited: dep, interest: M - dep });
    }, [rdM, rdR, rdT]);

    useEffect(() => {
        if (intP <= 0 || intR <= 0 || intT <= 0) {
            setIntResult({ total: 0, interest: 0 });
            return;
        }
        const r = intR / 100;
        if (intTy === 'simple') {
            const si = intP * r * intT;
            setIntResult({ total: intP + si, interest: si });
        } else {
            const a = intP * Math.pow(1 + r, intT);
            setIntResult({ total: a, interest: a - intP });
        }
    }, [intP, intR, intT, intTy]);

    useEffect(() => {
        setCurRes(curA * curR);
    }, [curA, curR]);

    useEffect(() => {
        if (stkQ <= 0 || stkB <= 0) {
            setStkResult({ profit: 0, roi: 0, investment: 0 });
            return;
        }
        const inv = stkB * stkQ;
        const bCost = (inv * stkBr) / 100;
        const tCost = inv + bCost;
        const sVal = stkS * stkQ;
        const sBr = (sVal * stkBr) / 100;
        const nS = sVal - sBr;
        const prof = nS - tCost;
        setStkResult({ profit: prof, roi: (prof / tCost) * 100, investment: tCost });
    }, [stkB, stkS, stkQ, stkBr]);

    // --- Render Helpers ---

    const renderHeader = (title: string) => (
        <View style={styles.calculatorHeader}>
            <TouchableOpacity onPress={() => setActiveCalculator('dashboard')} style={styles.backButton}>
                <Icon name="arrow-left" size={24} color={AIStudioTheme.colors.text} />
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.calculatorTitle}>{title}</Text>
        </View>
    );

    const renderDashboard = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.title}>Financial Tools</Text>
                <Text style={styles.subtitle}>Smart calculators for your wealth</Text>
            </View>
            <View style={styles.grid}>
                {calculators.map((calc) => {
                    const themeData = calculatorTheme[calc.id as keyof typeof calculatorTheme];
                    return (
                        <View key={calc.id} style={styles.cardWrapper}>
                            <CalculatorCard
                                title={calc.title}
                                description={calc.description}
                                icon={themeData.icon}
                                color={themeData.color}
                                onPress={() => {
                                    setActiveCalculator(calc.id as CalculatorId);
                                    if (calc.id === 'compareSip') setShowComparison(false);
                                }}
                            />
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );

    const renderSIP = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('SIP Calculator')}
            <ResultCard title="Estimated Value" value={sipResult.total} subtitle={`Invested: ₹${sipResult.invested.toLocaleString('en-IN')}`} gradientColors={calculatorTheme.sip[theme.dark ? 'dark' : 'light']} />
            <View style={styles.inputSection}>
                <SliderInput label="Monthly Investment" value={sipMonthly} min={0} max={1000000} step={500} onChange={setSipMonthly} unit="₹" />
                <SliderInput label="Return Rate (p.a.)" value={sipRate} min={0} max={50} step={0.5} onChange={setSipRate} unit="%" />
                <SliderInput label="Time Period" value={sipYears} min={0} max={50} step={1} onChange={setSipYears} unit="Years" />
            </View>
            <View style={styles.chartSection}><PieChartView invested={sipResult.invested} returns={sipResult.returns} /></View>
        </ScrollView>
    );

    const renderFD = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('FD Calculator')}
            <ResultCard title="Maturity Amount" value={fdResult.total} subtitle={`Interest: ₹${fdResult.interest.toLocaleString('en-IN')}`} gradientColors={calculatorTheme.fd[theme.dark ? 'dark' : 'light']} />
            <View style={styles.inputSection}>
                <SliderInput label="Principal Amount" value={fdP} min={0} max={100000000} step={10000} onChange={setFdP} unit="₹" />
                <SliderInput label="Interest Rate (p.a.)" value={fdR} min={0} max={25} step={0.1} onChange={setFdR} unit="%" />
                <SliderInput label="Tenure" value={fdT} min={0} max={30} step={0.5} onChange={setFdT} unit="Years" />
                <Text style={[styles.label, { color: AIStudioTheme.colors.text }]}>Compounding</Text>
                <SegmentedButtons value={fdComp} onValueChange={setFdComp} buttons={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]} style={styles.segmented} />
            </View>
            <View style={styles.chartSection}><PieChartView invested={fdP} returns={fdResult.interest} investedLabel="Principal" returnsLabel="Interest" /></View>
        </ScrollView>
    );

    const renderSWP = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('SWP Calculator')}
            <ResultCard title="Remaining Corpus" value={swpResult.remaining} subtitle={`Withdrawn: ₹${swpResult.withdrawn.toLocaleString('en-IN')}`} gradientColors={calculatorTheme.swp[theme.dark ? 'dark' : 'light']} />
            <View style={styles.inputSection}>
                <SliderInput label="Total Investment" value={swpP} min={0} max={100000000} step={100000} onChange={setSwpP} unit="₹" />
                <SliderInput label="Monthly Withdrawal" value={swpW} min={0} max={1000000} step={5000} onChange={setSwpW} unit="₹" />
                <SliderInput label="Return Rate" value={swpR} min={0} max={30} step={0.5} onChange={setSwpR} unit="%" />
                <SliderInput label="Time" value={swpT} min={0} max={50} step={1} onChange={setSwpT} unit="Years" />
            </View>
            <View style={styles.chartSection}><PieChartView invested={swpResult.withdrawn} returns={swpResult.remaining} investedLabel="Withdrawn" returnsLabel="Remaining" /></View>
        </ScrollView>
    );

    const renderSTP = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('STP Calculator')}
            <ResultCard title="Total Value" value={stpResult.total} subtitle={`Target: ₹${stpResult.target.toLocaleString('en-IN')}`} gradientColors={calculatorTheme.stp[theme.dark ? 'dark' : 'light']} />
            <View style={styles.inputSection}>
                <SliderInput label="Source Investment" value={stpSP} min={0} max={50000000} step={50000} onChange={setStpSP} unit="₹" />
                <SliderInput label="Monthly Transfer" value={stpM} min={0} max={1000000} step={5000} onChange={setStpM} unit="₹" />
                <SliderInput label="Source Return" value={stpSR} min={0} max={20} step={0.5} onChange={setStpSR} unit="%" />
                <SliderInput label="Target Return" value={stpTR} min={0} max={30} step={0.5} onChange={setStpTR} unit="%" />
                <SliderInput label="Time" value={stpT} min={0} max={30} step={1} onChange={setStpT} unit="Years" />
            </View>
            <View style={styles.chartSection}><PieChartView invested={stpResult.source} returns={stpResult.target} investedLabel="Source" returnsLabel="Target" /></View>
        </ScrollView>
    );

    const renderRetirement = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('Retirement Tool')}
            <ResultCard title="Required Corpus" value={retResult.corpus} subtitle={`Monthly SIP: ₹${retResult.sip.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} gradientColors={calculatorTheme.retirement[theme.dark ? 'dark' : 'light']} />
            <View style={styles.inputSection}>
                <SliderInput label="Current Age" value={retCA} min={18} max={60} step={1} onChange={setRetCA} unit="Y" />
                <SliderInput label="Retirement Age" value={retRA} min={retCA + 1} max={80} step={1} onChange={setRetRA} unit="Y" />
                <SliderInput label="Expenses (Today)" value={retE} min={0} max={1000000} step={5000} onChange={setRetE} unit="₹" />
                <SliderInput label="Inflation" value={retI} min={0} max={20} step={0.5} onChange={setRetI} unit="%" />
                <SliderInput label="Expect. Return" value={retR} min={0} max={30} step={0.5} onChange={setRetR} unit="%" />
                <SliderInput label="Life Expectancy" value={retLX} min={retRA + 1} max={110} step={1} onChange={setRetLX} unit="Y" />
            </View>
            <View style={styles.chartSection}>
                <PieChartView
                    invested={retResult.sip * (retRA - retCA) * 12}
                    returns={retResult.corpus - (retResult.sip * (retRA - retCA) * 12)}
                    investedLabel="Total Investment"
                    returnsLabel="Returns"
                />
            </View>
        </ScrollView>
    );


    const renderCompareSIP = () => {
        return (
            <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
                {renderHeader('Compare SIP')}
                
                {showComparison && (cSipResult.t1 > 0 || cSipResult.t2 > 0) && (
                    <Card style={[styles.comparisonCard, { backgroundColor: AIStudioTheme.colors.surfaceVariant }]}>
                        <Card.Content>
                            <Text style={{ color: AIStudioTheme.colors.textSecondary }}>{cSipResult.better === 'Both are equal' ? cSipResult.better : `${cSipResult.better} is better by`}</Text>
                            {cSipResult.diff > 0 && (
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: AIStudioTheme.colors.primary }}>₹ {cSipResult.diff.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                            )}
                        </Card.Content>
                    </Card>
                )}

                <ResultCard title="SIP 1 Value" value={cSipResult.t1} subtitle="Option A" gradientColors={['#4facfe', '#00f2fe']} />
                <SliderInput label="SIP 1 Monthly" value={cSipM1} min={0} max={1000000} step={500} onChange={setCSipM1} unit="₹" />
                <SliderInput label="SIP 1 Rate" value={cSipR1} min={0} max={50} step={0.5} onChange={setCSipR1} unit="%" />
                <SliderInput label="SIP 1 Tenure" value={cSipY1} min={0} max={50} step={1} onChange={setCSipY1} unit="Y" />

                <View style={{ marginVertical: 10 }} />

                <ResultCard title="SIP 2 Value" value={cSipResult.t2} subtitle="Option B" gradientColors={['#43e97b', '#38f9d7']} />
                <SliderInput label="SIP 2 Monthly" value={cSipM2} min={0} max={1000000} step={500} onChange={setCSipM2} unit="₹" />
                <SliderInput label="SIP 2 Rate" value={cSipR2} min={0} max={50} step={0.5} onChange={setCSipR2} unit="%" />
                <SliderInput label="SIP 2 Tenure" value={cSipY2} min={0} max={50} step={1} onChange={setCSipY2} unit="Y" />

                <Button 
                    mode="contained" 
                    onPress={handleCompareSIP}
                    style={{ marginTop: 20, borderRadius: 12, paddingVertical: 8, backgroundColor: AIStudioTheme.colors.primary }}
                    labelStyle={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}
                >
                    Compare Now
                </Button>
            </ScrollView>
        );
    };

    const renderPPF = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('PPF Calculator')}
            <ResultCard title="Maturity Amount" value={ppfResult.total} subtitle={`Interest: ₹${ppfResult.interest.toLocaleString('en-IN')}`} gradientColors={calculatorTheme.ppf[theme.dark ? 'dark' : 'light']} />
            <View style={styles.inputSection}>
                <SliderInput label="Yearly Deposit" value={ppfD} min={0} max={150000} step={500} onChange={setPpfD} unit="₹" />
                <SliderInput label="Tenure" value={ppfT} min={15} max={50} step={5} onChange={setPpfT} unit="Y" />
            </View>
            <View style={styles.chartSection}><PieChartView invested={ppfResult.deposited} returns={ppfResult.interest} investedLabel="Deposited" returnsLabel="Interest" /></View>
        </ScrollView>
    );

    const renderRD = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('RD Calculator')}
            <ResultCard title="Maturity Amount" value={rdResult.total} subtitle={`Interest: ₹${rdResult.interest.toLocaleString('en-IN')}`} gradientColors={calculatorTheme.rd[theme.dark ? 'dark' : 'light']} />
            <View style={styles.inputSection}>
                <SliderInput label="Monthly Deposit" value={rdM} min={0} max={1000000} step={500} onChange={setRdM} unit="₹" />
                <SliderInput label="Return Rate" value={rdR} min={0} max={20} step={0.1} onChange={setRdR} unit="%" />
                <SliderInput label="Tenure" value={rdT} min={0} max={20} step={0.5} onChange={setRdT} unit="Y" />
            </View>
            <View style={styles.chartSection}><PieChartView invested={rdResult.deposited} returns={rdResult.interest} investedLabel="Deposited" returnsLabel="Interest" /></View>
        </ScrollView>
    );

    const renderInterest = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('Interest Tool')}
            <ResultCard title="Total Amount" value={intResult.total} subtitle={`Interest: ₹${intResult.interest.toLocaleString('en-IN')}`} gradientColors={calculatorTheme.interest[theme.dark ? 'dark' : 'light']} />
            <View style={styles.inputSection}>
                <SegmentedButtons value={intTy} onValueChange={setIntTy} buttons={[{ value: 'simple', label: 'Simple' }, { value: 'compound', label: 'Compound' }]} style={styles.segmented} />
                <SliderInput label="Principal" value={intP} min={0} max={100000000} step={1000} onChange={setIntP} unit="₹" />
                <SliderInput label="Rate" value={intR} min={0} max={100} step={0.5} onChange={setIntR} unit="%" />
                <SliderInput label="Time" value={intT} min={0} max={50} step={1} onChange={setIntT} unit="Y" />
            </View>
            <View style={styles.chartSection}>
                <PieChartView invested={intP} returns={intResult.interest} investedLabel="Principal" returnsLabel="Interest" />
            </View>
        </ScrollView>
    );


    const renderCurrency = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('Currency Converter')}
            <ResultCard title="Converted" value={curRes} subtitle={`${curA} USD to INR`} gradientColors={calculatorTheme.currency[theme.dark ? 'dark' : 'light']} />
            <View style={styles.inputSection}>
                <SliderInput label="Amount (USD)" value={curA} min={0} max={1000000} step={10} onChange={setCurA} unit="$" />
                <SliderInput label="Ex. Rate (1$ = ?₹)" value={curR} min={0} max={200} step={0.1} onChange={setCurR} unit="₹" />
            </View>
        </ScrollView>
    );

    const renderStock = () => (
        <ScrollView style={styles.calculatorContainer} contentContainerStyle={styles.content}>
            {renderHeader('Stock P/L')}
            <ResultCard title={stkResult.profit >= 0 ? 'Profit' : 'Loss'} value={Math.abs(stkResult.profit)} subtitle={`ROI: ${stkResult.roi.toFixed(2)}%`} gradientColors={stkResult.profit >= 0 ? calculatorTheme.stock[theme.dark ? 'dark' : 'light'] : ['#e53935', '#c62828']} />
            <View style={styles.inputSection}>
                <SliderInput label="Buy Price" value={stkB} min={0} max={100000} step={1} onChange={setStkB} unit="₹" />
                <SliderInput label="Sell Price" value={stkS} min={0} max={100000} step={1} onChange={setStkS} unit="₹" />
                <SliderInput label="Quantity" value={stkQ} min={0} max={100000} step={1} onChange={setStkQ} unit="S" />
                <SliderInput label="Brokerage" value={stkBr} min={0} max={5} step={0.01} onChange={setStkBr} unit="%" />
            </View>
            <View style={styles.chartSection}>
                <PieChartView
                    invested={stkResult.investment}
                    returns={Math.max(0, stkResult.profit)}
                    investedLabel="Investment"
                    returnsLabel={stkResult.profit >= 0 ? "Profit" : "Loss"}
                />
            </View>
        </ScrollView>
    );


    const renderContent = () => {
        switch (activeCalculator) {
            case 'sip': return renderSIP();
            case 'fd': return renderFD();
            case 'swp': return renderSWP();
            case 'stp': return renderSTP();
            case 'retirement': return renderRetirement();
            case 'compareSip': return renderCompareSIP();
            case 'ppf': return renderPPF();
            case 'rd': return renderRD();
            case 'interest': return renderInterest();
            case 'currency': return renderCurrency();
            case 'stock': return renderStock();
            default: return renderDashboard();
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[AIStudioTheme.colors.background, '#1a1a1e']} style={styles.container}>
                {renderContent()}
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingTop: 40, paddingBottom: 100 },
    header: { marginBottom: 30 },
    title: { fontSize: 32, fontWeight: 'bold', color: AIStudioTheme.colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: AIStudioTheme.colors.textSecondary, opacity: 0.8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -10 },
    cardWrapper: { width: '50%', padding: 4 },
    calculatorContainer: { flex: 1 },
    content: { padding: 20, paddingTop: 40, paddingBottom: 100 },
    calculatorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, zIndex: 10 },
    backText: { marginLeft: 8, fontSize: 16, color: AIStudioTheme.colors.text, fontWeight: '600' },
    calculatorTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: AIStudioTheme.colors.text, marginRight: 60 },
    inputSection: { backgroundColor: AIStudioTheme.colors.surface, borderRadius: 20, padding: 20, marginBottom: 20, ...AIStudioTheme.shadows.sm },
    chartSection: { backgroundColor: AIStudioTheme.colors.surface, borderRadius: 20, padding: 20, alignItems: 'center', ...AIStudioTheme.shadows.sm, marginBottom: 30 },
    label: { fontSize: 16, fontWeight: '600', color: AIStudioTheme.colors.text, marginBottom: 12 },
    segmented: { backgroundColor: AIStudioTheme.colors.surfaceVariant, marginBottom: 16 },
    comparisonCard: { marginBottom: 20, borderRadius: 16, padding: 12 },
});
