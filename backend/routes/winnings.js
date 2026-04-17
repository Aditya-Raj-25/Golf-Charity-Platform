const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/authMiddleware');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('winnings')
    .select(`
      id, prize_amount, proof_url, matches, is_approved, payment_status,
      draw:draws (run_at, num1, num2, num3, num4, num5)
    `)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

router.post('/:id/proof', requireAuth, upload.single('proof'), async (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${id}.${fileExt}`;
    const filePath = `proofs/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('winner-proofs')
      .getPublicUrl(filePath);

    // Update winnings record
    const { data: updatedWinning, error: dbError } = await supabase
      .from('winnings')
      .update({ proof_url: publicUrl })
      .match({ id, user_id: req.user.id })
      .select();

    if (dbError) throw dbError;

    res.json({ message: 'Proof uploaded successfully', proof_url: publicUrl });
  } catch (err) {
    console.error('Proof Upload Error:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
