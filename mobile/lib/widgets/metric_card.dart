import 'package:flutter/material.dart';

class MetricCard extends StatelessWidget {
  final String label;
  final double? value;
  final Color color;

  const MetricCard({
    super.key,
    required this.label,
    this.value,
    this.color = const Color(0xFF1565C0),
  });

  @override
  Widget build(BuildContext context) {
    final pct = value != null ? '${(value! * 100).toStringAsFixed(1)}%' : '—';
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(pct,
              style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: color)),
          const SizedBox(height: 4),
          Text(label,
              style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
