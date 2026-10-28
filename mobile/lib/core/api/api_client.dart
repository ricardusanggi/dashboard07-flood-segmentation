import 'package:dio/dio.dart';
import '../constants.dart';
import '../storage/auth_storage.dart';

class ApiClient {
  static final Dio _dio = _build();

  static Dio get dio => _dio;

  static Dio _build() {
    final d = Dio(BaseOptions(
      baseUrl: kBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 60),
      sendTimeout: const Duration(seconds: 60),
      headers: {'Accept': 'application/json'},
    ));

    // Inject Authorization header otomatis
    d.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await AuthStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (e, handler) {
        handler.next(e);
      },
    ));

    return d;
  }
}
