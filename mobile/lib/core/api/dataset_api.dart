import 'dart:io';
import 'package:dio/dio.dart';
import 'api_client.dart';

class DatasetApi {
  static final _dio = ApiClient.dio;

  static Future<Map<String, dynamic>> upload(File zipFile) async {
    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        zipFile.path,
        filename: zipFile.path.split('/').last,
      ),
    });

    final resp = await _dio.post(
      '/users/datasets/upload',
      data: form,
      options: Options(
        sendTimeout:    const Duration(minutes: 10),
        receiveTimeout: const Duration(minutes: 10),
      ),
    );

    return resp.data as Map<String, dynamic>;
  }

  static Future<List<Map<String, dynamic>>> getPending() async {
    final resp = await _dio.get('/users/datasets/pending');
    final data = resp.data;
    if (data is List) return data.cast<Map<String, dynamic>>();
    final list = (data as Map)['data'];
    if (list is List) return list.cast<Map<String, dynamic>>();
    return [];
  }

  static Future<Map<String, dynamic>> getHistory({int page = 1}) async {
    final resp = await _dio.get(
      '/users/datasets/history',
      queryParameters: {'page': page, 'limit': 20},
    );
    return resp.data as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getPublicMetrics() async {
    final resp = await _dio.get('/public/model-metrics');
    return resp.data as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getPublicModelInfo() async {
    final resp = await _dio.get('/public/model-info');
    return resp.data as Map<String, dynamic>;
  }
}
