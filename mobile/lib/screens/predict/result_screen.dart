import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/api/predict_api.dart';
import '../../core/constants.dart';
import '../../widgets/metric_card.dart';

class ResultScreen extends StatefulWidget {
  final SegmentationResult result;
  const ResultScreen({super.key, required this.result});

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  int _viewIndex = 1; // 0=original, 1=overlay, 2=mask

  @override
  Widget build(BuildContext context) {
    final r = widget.result;
    final imgs = [r.originalImage, r.overlayImage, r.segmentedImage];
    final labels = ['Asli', 'Overlay', 'Segmentasi'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hasil Segmentasi'),
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Image view switcher
            Container(
              color: Colors.black,
              width: double.infinity,
              height: 300,
              child: imgs[_viewIndex].isNotEmpty
                  ? Image.memory(
                      base64Decode(imgs[_viewIndex]),
                      fit: BoxFit.contain,
                    )
                  : const Center(
                      child: Icon(Icons.broken_image,
                          color: Colors.white54, size: 64)),
            ),

            // Image type tabs
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              child: Row(
                children: List.generate(3, (i) {
                  final selected = _viewIndex == i;
                  return Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(left: i > 0 ? 8 : 0),
                      child: GestureDetector(
                        onTap: () => setState(() => _viewIndex = i),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: selected ? kPrimary : kSurface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: selected ? kPrimary : Colors.grey.shade300),
                          ),
                          child: Text(
                            labels[i],
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: selected ? Colors.white : Colors.grey[600],
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),

            // Metrics
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Metrik Evaluasi',
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: kPrimary)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                          child: MetricCard(
                              label: 'IoU',
                              value: r.iou,
                              color: kPrimary)),
                      const SizedBox(width: 10),
                      Expanded(
                          child: MetricCard(
                              label: 'Dice',
                              value: r.dice,
                              color: kAccent)),
                      const SizedBox(width: 10),
                      Expanded(
                          child: MetricCard(
                              label: 'Pixel Acc',
                              value: r.pixelAcc,
                              color: kSuccess)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Method info
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: kSurface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: kPrimary.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.memory, color: kPrimary, size: 20),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Model yang digunakan',
                                style: TextStyle(
                                    fontSize: 11, color: Colors.grey)),
                            Text(r.method,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: kPrimary)),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Flood level indicator
                  _buildFloodIndicator(r.iou),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFloodIndicator(double? iou) {
    if (iou == null) return const SizedBox.shrink();
    final pct = iou * 100;
    final color = pct < 20
        ? kSuccess
        : pct < 50
            ? kWarning
            : kError;
    final label = pct < 20
        ? 'Banjir Rendah'
        : pct < 50
            ? 'Banjir Sedang'
            : 'Banjir Tinggi';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: color, size: 28),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: color,
                      fontSize: 15)),
              Text('Cakupan banjir: ${pct.toStringAsFixed(1)}%',
                  style: TextStyle(fontSize: 12, color: color.withValues(alpha: 0.8))),
            ],
          ),
        ],
      ),
    );
  }
}
