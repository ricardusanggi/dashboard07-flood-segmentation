import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api/predict_api.dart';
import '../../core/constants.dart';
import '../../widgets/app_button.dart';
import 'result_screen.dart';

class PredictScreen extends StatefulWidget {
  const PredictScreen({super.key});

  @override
  State<PredictScreen> createState() => _PredictScreenState();
}

class _PredictScreenState extends State<PredictScreen> {
  File?   _image;
  bool    _predicting = false;
  String? _error;

  final _picker = ImagePicker();

  Future<void> _pick(ImageSource source) async {
    try {
      final xFile = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        imageQuality: 90,
      );
      if (xFile != null) {
        setState(() { _image = File(xFile.path); _error = null; });
      }
    } catch (e) {
      setState(() => _error = 'Gagal memilih gambar: $e');
    }
  }

  Future<void> _predict() async {
    if (_image == null) return;
    setState(() { _predicting = true; _error = null; });
    try {
      final result = await PredictApi.predict(_image!);
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ResultScreen(result: result)),
      );
    } catch (e) {
      String msg = e.toString();
      final m = RegExp(r'"detail"\s*:\s*"([^"]+)"').firstMatch(msg);
      setState(() => _error = m?.group(1) ?? 'Prediksi gagal. $msg');
    } finally {
      if (mounted) setState(() => _predicting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Prediksi Banjir'),
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kAccent.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kAccent.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: kAccent, size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Upload foto area yang ingin dideteksi banjirnya. '
                      'Model AI akan menghasilkan segmentasi area banjir.',
                      style: TextStyle(fontSize: 12, color: kAccent),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Image preview / picker area
            GestureDetector(
              onTap: _predicting ? null : () => _showSourceDialog(),
              child: Container(
                width: double.infinity,
                height: 240,
                decoration: BoxDecoration(
                  color: kSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _image != null ? kPrimary : Colors.grey.shade300,
                    width: 2,
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: _image != null
                    ? Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.file(_image!, fit: BoxFit.cover),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: GestureDetector(
                              onTap: () => setState(() => _image = null),
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.black54,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close,
                                    color: Colors.white, size: 18),
                              ),
                            ),
                          ),
                        ],
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined,
                              size: 56, color: Colors.grey[400]),
                          const SizedBox(height: 12),
                          Text(
                            'Ketuk untuk memilih gambar',
                            style: TextStyle(
                                color: Colors.grey[500], fontSize: 14),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Kamera atau Galeri',
                            style: TextStyle(
                                color: Colors.grey[400], fontSize: 12),
                          ),
                        ],
                      ),
              ),
            ),

            const SizedBox(height: 16),

            // Source buttons when no image selected
            if (_image == null)
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pick(ImageSource.camera),
                      icon: const Icon(Icons.camera_alt_outlined),
                      label: const Text('Kamera'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: kPrimary,
                        side: const BorderSide(color: kPrimary),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pick(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library_outlined),
                      label: const Text('Galeri'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: kPrimary,
                        side: const BorderSide(color: kPrimary),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),

            if (_image != null) ...[
              AppButton(
                label: _predicting ? 'Memproses...' : 'Mulai Prediksi',
                icon: Icons.water_drop,
                loading: _predicting,
                onPressed: _predict,
              ),
              const SizedBox(height: 10),
              Center(
                child: TextButton.icon(
                  onPressed: _predicting ? null : () => _showSourceDialog(),
                  icon: const Icon(Icons.swap_horiz, size: 16),
                  label: const Text('Ganti Gambar'),
                ),
              ),
            ],

            if (_predicting) ...[
              const SizedBox(height: 20),
              const Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 12),
                    Text('Sedang menganalisis gambar...',
                        style: TextStyle(color: Colors.grey)),
                    Text('Proses mungkin memerlukan beberapa detik',
                        style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
            ],

            if (_error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: kError.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kError.withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: kError, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(_error!,
                          style: const TextStyle(color: kError, fontSize: 13)),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showSourceDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Pilih Sumber Gambar',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: kSurface,
                  child: Icon(Icons.camera_alt, color: kPrimary),
                ),
                title: const Text('Kamera'),
                subtitle: const Text('Ambil foto langsung'),
                onTap: () {
                  Navigator.pop(context);
                  _pick(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: kSurface,
                  child: Icon(Icons.photo_library, color: kAccent),
                ),
                title: const Text('Galeri'),
                subtitle: const Text('Pilih dari galeri foto'),
                onTap: () {
                  Navigator.pop(context);
                  _pick(ImageSource.gallery);
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
