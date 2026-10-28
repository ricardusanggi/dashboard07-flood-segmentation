import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/api/dataset_api.dart';
import '../../widgets/metric_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _metrics;
  Map<String, dynamic>? _modelInfo;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        DatasetApi.getPublicMetrics(),
        DatasetApi.getPublicModelInfo(),
      ]);
      if (!mounted) return;
      setState(() {
        _metrics   = results[0];
        _modelInfo = results[1];
        _loading   = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final name = user?.displayName ?? 'Pengguna';

    return Scaffold(
      backgroundColor: kSurface,
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 160,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [kPrimary, kAccent],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  padding: const EdgeInsets.fromLTRB(24, 56, 24, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Halo, $name 👋',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      const Text('FloodSeg AI — Deteksi Banjir',
                          style:
                              TextStyle(color: Colors.white70, fontSize: 13)),
                    ],
                  ),
                ),
              ),
              backgroundColor: kPrimary,
            ),

            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Model metrics section
                  _sectionTitle('Performa Model Aktif'),
                  const SizedBox(height: 10),
                  _loading
                      ? const Center(child: CircularProgressIndicator())
                      : _buildMetrics(),

                  const SizedBox(height: 20),

                  // Model info
                  if (_modelInfo != null) ...[
                    _sectionTitle('Informasi Model'),
                    const SizedBox(height: 10),
                    _buildModelInfo(),
                    const SizedBox(height: 20),
                  ],

                  // Quick actions
                  _sectionTitle('Aksi Cepat'),
                  const SizedBox(height: 10),
                  _buildQuickActions(context),
                  const SizedBox(height: 24),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String t) => Text(t,
      style: const TextStyle(
          fontSize: 15, fontWeight: FontWeight.bold, color: kPrimary));

  Widget _buildMetrics() {
    final m = _metrics;
    if (m == null || m.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Text('Belum ada model yang dilatih.',
            style: TextStyle(color: Colors.grey)),
      );
    }

    double? toD(dynamic v) =>
        v == null ? null : double.tryParse(v.toString());

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.1,
      children: [
        MetricCard(label: 'IoU',       value: toD(m['iou']),       color: kPrimary),
        MetricCard(label: 'Dice',      value: toD(m['dice']),      color: kAccent),
        MetricCard(label: 'Pixel Acc', value: toD(m['pixel_acc']), color: kSuccess),
      ],
    );
  }

  Widget _buildModelInfo() {
    final info = _modelInfo!;
    final rows = <String, String>{
      'Arsitektur': info['architecture']?.toString() ?? '-',
      'Backbone':   info['backbone']?.toString()     ?? '-',
      'Optimizer':  info['optimizer']?.toString()    ?? '-',
      'Loss Fn':    info['loss_function']?.toString() ?? '-',
    };
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: rows.entries
              .map((e) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        SizedBox(
                            width: 90,
                            child: Text(e.key,
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[600]))),
                        Expanded(
                          child: Text(e.value,
                              style: const TextStyle(
                                  fontSize: 12, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ))
              .toList(),
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      const _QA('Prediksi Banjir', Icons.water, kPrimary, 1),
      const _QA('Upload Dataset',  Icons.upload, kAccent,  2),
      const _QA('Riwayat',         Icons.history, kSuccess, 3),
    ];
    return Row(
      children: actions
          .map((a) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: _QuickActionCard(
                    qa: a,
                    onTap: () => _navigateTo(context, a.tabIndex),
                  ),
                ),
              ))
          .toList(),
    );
  }

  void _navigateTo(BuildContext context, int index) {
    Navigator.pushReplacementNamed(context, '/home');
  }
}

class _QA {
  final String label;
  final IconData icon;
  final Color color;
  final int tabIndex;
  const _QA(this.label, this.icon, this.color, this.tabIndex);
}

class _QuickActionCard extends StatelessWidget {
  final _QA qa;
  final VoidCallback onTap;
  const _QuickActionCard({required this.qa, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: qa.color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: qa.color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Icon(qa.icon, color: qa.color, size: 28),
            const SizedBox(height: 8),
            Text(qa.label,
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 11,
                    color: qa.color,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
