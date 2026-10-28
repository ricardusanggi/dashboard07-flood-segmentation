import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../core/api/dataset_api.dart';
import '../../core/constants.dart';
import '../../widgets/app_button.dart';

class DatasetScreen extends StatefulWidget {
  const DatasetScreen({super.key});

  @override
  State<DatasetScreen> createState() => _DatasetScreenState();
}

class _DatasetScreenState extends State<DatasetScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dataset'),
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'Upload', icon: Icon(Icons.upload_file, size: 18)),
            Tab(text: 'Status', icon: Icon(Icons.pending_actions, size: 18)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: const [
          _UploadTab(),
          _PendingTab(),
        ],
      ),
    );
  }
}

class _UploadTab extends StatefulWidget {
  const _UploadTab();

  @override
  State<_UploadTab> createState() => _UploadTabState();
}

class _UploadTabState extends State<_UploadTab> {
  File?   _file;
  bool    _uploading = false;
  String? _result;
  bool    _success   = false;

  Future<void> _pick() async {
    final r = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['zip'],
    );
    if (r != null && r.files.single.path != null) {
      setState(() { _file = File(r.files.single.path!); _result = null; });
    }
  }

  Future<void> _upload() async {
    if (_file == null) return;
    setState(() { _uploading = true; _result = null; });
    try {
      final res = await DatasetApi.upload(_file!);
      setState(() {
        _success = true;
        _result  = res['message'] ?? 'Dataset berhasil diupload dan menunggu persetujuan.';
        _file    = null;
      });
    } catch (e) {
      String msg = e.toString();
      // Extract DioException detail
      final m = RegExp(r'"detail"\s*:\s*"([^"]+)"').firstMatch(msg);
      setState(() {
        _success = false;
        _result  = m?.group(1) ?? msg;
      });
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Instructions
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: kPrimary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: kPrimary.withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.info_outline, color: kPrimary, size: 18),
                    SizedBox(width: 8),
                    Text('Format Dataset',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, color: kPrimary)),
                  ],
                ),
                const SizedBox(height: 10),
                _infoRow('File', 'ZIP berisi folder images/ dan masks/'),
                _infoRow('images/', 'File gambar banjir (.jpg / .png)'),
                _infoRow('masks/', 'Mask biner: putih=banjir, hitam=tidak'),
                _infoRow('Catatan', 'Nama file gambar dan mask harus sama'),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // File picker
          GestureDetector(
            onTap: _uploading ? null : _pick,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 28),
              decoration: BoxDecoration(
                color: kSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _file != null ? kAccent : Colors.grey.shade300,
                  width: 2,
                  style: BorderStyle.solid,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    _file != null ? Icons.folder_zip : Icons.upload_file,
                    size: 48,
                    color: _file != null ? kAccent : Colors.grey,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _file != null
                        ? _file!.path.split('/').last
                        : 'Ketuk untuk memilih file ZIP',
                    style: TextStyle(
                      color: _file != null ? kPrimary : Colors.grey,
                      fontWeight: _file != null ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                  if (_file != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '${(_file!.lengthSync() / 1048576).toStringAsFixed(1)} MB',
                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                    ),
                  ],
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          if (_file != null)
            AppButton(
              label: 'Upload Dataset',
              icon: Icons.cloud_upload,
              loading: _uploading,
              onPressed: _upload,
            ),

          if (_result != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: (_success ? kSuccess : kError).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: (_success ? kSuccess : kError).withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  Icon(
                    _success ? Icons.check_circle_outline : Icons.error_outline,
                    color: _success ? kSuccess : kError,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(_result!,
                        style: TextStyle(
                            color: _success ? kSuccess : kError,
                            fontSize: 13)),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(String key, String val) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 70,
              child: Text(key,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600])),
            ),
            const Text(': ', style: TextStyle(fontSize: 12)),
            Expanded(
              child: Text(val,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w500)),
            ),
          ],
        ),
      );
}

class _PendingTab extends StatefulWidget {
  const _PendingTab();

  @override
  State<_PendingTab> createState() => _PendingTabState();
}

class _PendingTabState extends State<_PendingTab> {
  List<Map<String, dynamic>> _pending = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await DatasetApi.getPending();
      setState(() { _pending = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_pending.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.pending_actions, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 12),
            Text('Tidak ada dataset yang menunggu',
                style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _load, child: const Text('Muat Ulang')),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _pending.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final d = _pending[i];
          final status  = d['status']?.toString()    ?? 'pending';
          final name    = d['dataset_name']?.toString() ?? d['filename']?.toString() ?? '-';
          final date    = d['created_at']?.toString() ?? '';
          final isOk    = status == 'approved';
          final isRej   = status == 'rejected';
          final color   = isOk ? kSuccess : isRej ? kError : kWarning;

          return Card(
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14)),
            elevation: 2,
            child: ListTile(
              leading: Icon(
                isOk ? Icons.check_circle : isRej ? Icons.cancel : Icons.pending,
                color: color,
                size: 32,
              ),
              title: Text(name,
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(
                _fmtDate(date),
                style: const TextStyle(fontSize: 12),
              ),
              trailing: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: color.withValues(alpha: 0.4)),
                ),
                child: Text(
                  isOk ? 'Disetujui' : isRej ? 'Ditolak' : 'Menunggu',
                  style: TextStyle(
                      color: color,
                      fontSize: 11,
                      fontWeight: FontWeight.w600),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _fmtDate(String s) {
    try {
      final dt = DateTime.parse(s).toLocal();
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return s;
    }
  }
}
