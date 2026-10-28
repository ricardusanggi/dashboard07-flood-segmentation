import 'dart:io';
import 'package:dio/dio.dart';
import 'api_client.dart';

class SegmentationResult {
  final String method;
  final String segmentedImage;  // base64
  final String overlayImage;    // base64
  final String originalImage;   // base64
  final Map<String, dynamic>? metrics;

  SegmentationResult({
    required this.method,
    required this.segmentedImage,
    required this.overlayImage,
    required this.originalImage,
    this.metrics,
  });

  factory SegmentationResult.fromJson(Map<String, dynamic> j) =>
      SegmentationResult(
        method:         j['method']         ?? '',
        segmentedImage: j['segmented_image'] ?? '',
        overlayImage:   j['overlay_image']   ?? '',
        originalImage:  j['original_image']  ?? '',
        metrics:        j['metrics'] as Map<String, dynamic>?,
      );

  double? get iou       => _toDouble(metrics?['iou']);
  double? get dice      => _toDouble(metrics?['dice']);
  double? get pixelAcc  => _toDouble(metrics?['pixel_acc']);

  static double? _toDouble(dynamic v) =>
      v == null ? null : double.tryParse(v.toString());
}

class PredictApi {
  static final _dio = ApiClient.dio;

  static Future<SegmentationResult> predict(File imageFile) async {
    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        imageFile.path,
        filename: imageFile.path.split('/').last,
      ),
    });

    final resp = await _dio.post(
      '/predict/upload-image-testing',
      data: form,
      options: Options(receiveTimeout: const Duration(minutes: 3)),
    );

    return SegmentationResult.fromJson(resp.data);
  }

  static Future<List<Map<String, dynamic>>> getHistory() async {
    final resp = await _dio.get('/users/predictions/history');
    final data = resp.data;
    if (data is List) return data.cast<Map<String, dynamic>>();
    final list = data['data'];
    if (list is List) return list.cast<Map<String, dynamic>>();
    return [];
  }

  static Future<Map<String, dynamic>> getMethodInfo() async {
    final resp = await _dio.get('/predict/method-info');
    return resp.data as Map<String, dynamic>;
  }
}
