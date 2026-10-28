import 'package:dio/dio.dart';
import 'api_client.dart';
import '../models/user.dart';
import '../storage/auth_storage.dart';

class AuthApi {
  static final _dio = ApiClient.dio;

  /// Login → simpan token, return User
  static Future<User> login(String identifier, String password) async {
    final resp = await _dio.post(
      '/auth/token',
      data: FormData.fromMap({
        'username': identifier,
        'password': password,
      }),
      options: Options(contentType: 'application/x-www-form-urlencoded'),
    );

    final token = resp.data['access_token'] as String;
    final me    = await _fetchMe(token);

    await AuthStorage.saveToken(token, role: me.role);
    return me;
  }

  /// Register akun baru
  static Future<void> register({
    required String username,
    required String email,
    required String password,
    String? fullName,
  }) async {
    await _dio.post('/auth/register', data: {
      'username':  username,
      'email':     email,
      'password':  password,
      'full_name': fullName ?? '',
    });
  }

  /// Ambil profil user sendiri
  static Future<User> getMe() async {
    final resp = await _dio.get('/users/me');
    return User.fromJson(resp.data);
  }

  static Future<User> _fetchMe(String token) async {
    final resp = await _dio.get(
      '/users/me',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    return User.fromJson(resp.data);
  }

  static Future<void> updateMe({String? fullName, String? email}) async {
    final body = <String, dynamic>{};
    if (fullName != null) body['full_name'] = fullName;
    if (email    != null) body['email']     = email;
    await _dio.put('/users/me', data: body);
  }
}
