using System;
using System.IO;
using System.Collections.Generic;
using System.Text.Json;

namespace fayl
{
    public class ShubhaliFayl
    {
        public string Nomi { get; set; } = string.Empty;
        public string Joylashuvi { get; set; } = string.Empty;
        public long Hajmi { get; set; }
        public string YaratilganVaqti { get; set; } = string.Empty;
        public string XavfTuri { get; set; } = string.Empty;
    }

    public class SkanerHisoboti
    {
        public string SkanerlanganVaqt { get; set; } = string.Empty;
        public int JamiTekshirilgan { get; set; }
        public List<ShubhaliFayl> TopilganFayllar { get; set; } = new();
    }

    class Program
    {
        static List<ShubhaliFayl> topilganlar = new List<ShubhaliFayl>();
        static int tekshirilganFayllar = 0;

        static void Main(string[] args)
        {
            Console.WriteLine("Skanerlash boshlandi... Biroz kuting.\n");

            DriveInfo[] drives = DriveInfo.GetDrives();
            foreach (DriveInfo drive in drives)
            {
                if (drive.IsReady)
                {
                    Console.WriteLine($"Disk tekshirilmoqda: {drive.Name}");
                    WalkDirectory(drive.RootDirectory.FullName);
                }
            }

            Console.WriteLine("\n========================");
            Console.WriteLine("Skanerlash tugadi!");
            Console.WriteLine($"Jami tekshirilgan fayllar: {tekshirilganFayllar}");
            Console.WriteLine($"Topilgan Shubhali fayllar: {topilganlar.Count}");

            // Natijani to'g'ridan-to'g'ri React frontend qismiga JSON qilib yozamiz
            var hisobot = new SkanerHisoboti
            {
                SkanerlanganVaqt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                JamiTekshirilgan = tekshirilganFayllar,
                TopilganFayllar = topilganlar
            };

            string jsonString = JsonSerializer.Serialize(hisobot, new JsonSerializerOptions { WriteIndented = true });
            
            // frontend/src/report.json papkasiga saqlaymiz
            string frontendPath = Path.Combine(Directory.GetCurrentDirectory(), "frontend", "src", "report.json");
            File.WriteAllText(frontendPath, jsonString);

            Console.WriteLine($"\nNatija frontendga muvaffaqiyatli yuborildi: {frontendPath}");
        }

        static void WalkDirectory(string path)
        {
            // Tizim papkalarini va node_modules ni chetlab o'tamiz
            if (path.Contains(@"\Windows", StringComparison.OrdinalIgnoreCase) ||
                path.Contains(@"\Program Files", StringComparison.OrdinalIgnoreCase) ||
                path.Contains(@"\Program Files (x86)", StringComparison.OrdinalIgnoreCase) ||
                path.Contains(@"\node_modules", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            try
            {
                string[] files = Directory.GetFiles(path);
                foreach (string file in files)
                {
                    tekshirilganFayllar++;
                    string faylNomi = Path.GetFileName(file); // Path klassi orqali to'g'irlandi

                    // Shubhali kengaytmalar to'g'ri tekshirilmoqda
                    bool ikkiQavatli = faylNomi.EndsWith(".pdf.exe", StringComparison.OrdinalIgnoreCase) ||
                                       faylNomi.EndsWith(".jpg.exe", StringComparison.OrdinalIgnoreCase) ||
                                       faylNomi.EndsWith(".docx.exe", StringComparison.OrdinalIgnoreCase);

                    bool xavfliScriptlar = faylNomi.EndsWith(".vbs", StringComparison.OrdinalIgnoreCase) ||
                                        faylNomi.EndsWith(".scr", StringComparison.OrdinalIgnoreCase);

                    if (ikkiQavatli || xavfliScriptlar)
                    {
                        FileInfo fi = new FileInfo(file);
                        topilganlar.Add(new ShubhaliFayl
                        {
                            Nomi = faylNomi,
                            Joylashuvi = file,
                            Hajmi = fi.Length,
                            YaratilganVaqti = fi.CreationTime.ToString("yyyy-MM-dd HH:mm"),
                            XavfTuri = ikkiQavatli ? "Ikki qavatli kengaytma" : "Shubhali script"
                        });

                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine($"[!] Topildi: {faylNomi} -> {file}");
                        Console.ResetColor();
                    }
                }

                string[] subDirs = Directory.GetDirectories(path);
                foreach (string subDir in subDirs)
                {
                    WalkDirectory(subDir);
                }
            }
            catch
            {
                // Tizim ruxsat bermagan papkalar tashlab o'tiladi
            }
        }
    }
}