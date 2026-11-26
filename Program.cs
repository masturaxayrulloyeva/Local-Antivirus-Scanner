using System;
using System.IO;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

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

        // QO'SHILDI: Diskdagi eng katta 10 ta fayl uchun ro'yxat
        public List<ShubhaliFayl> EngKattaFayllar { get; set; } = new();
    }

    class Program
    {
        static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReact", policy =>
                    policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
            });

            var app = builder.Build();
            app.UseCors("AllowReact");

            app.MapGet("/", () => Results.Ok(new
            {
                status = "Antivirus API ishlayapti",
                skanerlashUchun = "http://localhost:5000/api/scan"
            }));
            app.MapGet("/api/scan", () =>
            {
                List<ShubhaliFayl> topilganlar = new List<ShubhaliFayl>();
                // Barcha tekshirilgan fayllarning hajmi uchun vaqtinchalik ro'yxat
                List<ShubhaliFayl> barchaFayllar = new List<ShubhaliFayl>();
                int tekshirilganFayllar = 0;

                Console.WriteLine("Skanerlash boshlandi... Biroz kuting.\n");

                DriveInfo[] drives = DriveInfo.GetDrives();
                foreach (DriveInfo drive in drives)
                {
                    if (drive.IsReady)
                    {
                        WalkDirectory(drive.RootDirectory.FullName, topilganlar, barchaFayllar, ref tekshirilganFayllar);
                    }
                }

                // Eng katta 10 ta faylni topib olamiz
                var top10Katta = barchaFayllar
                    .OrderByDescending(f => f.Hajmi)
                    .Take(10)
                    .ToList();

                var hisobot = new SkanerHisoboti
                {
                    SkanerlanganVaqt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    JamiTekshirilgan = tekshirilganFayllar,
                    TopilganFayllar = topilganlar,
                    EngKattaFayllar = top10Katta
                };

                Console.WriteLine("\n========================");
                Console.WriteLine("Skanerlash tugadi!");
                Console.WriteLine($"Jami tekshirilgan fayllar: {tekshirilganFayllar}");
                Console.WriteLine($"Topilgan Shubhali fayllar: {topilganlar.Count}");

                return Results.Ok(hisobot);
            });

            Console.WriteLine("Backend server ishga tushdi: http://localhost:5000");
            app.Run("http://localhost:5000");
        }

        static void WalkDirectory(string path, List<ShubhaliFayl> topilganlar, List<ShubhaliFayl> barchaFayllar, ref int tekshirilganFayllar)
        {
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
                    string faylNomi = Path.GetFileName(file);
                    FileInfo fi;

                    try
                    {
                        fi = new FileInfo(file);
                    }
                    catch
                    {
                        continue;
                    }

                    // Barcha fayllarni eng katta fayllarni saralash uchun qo'shib boramiz
                    barchaFayllar.Add(new ShubhaliFayl
                    {
                        Nomi = faylNomi,
                        Joylashuvi = file,
                        Hajmi = fi.Length,
                        YaratilganVaqti = fi.CreationTime.ToString("yyyy-MM-dd HH:mm"),
                        XavfTuri = "Oddiy"
                    });

                    bool ikkiQavatli = faylNomi.EndsWith(".pdf.exe", StringComparison.OrdinalIgnoreCase) ||
                                       faylNomi.EndsWith(".jpg.exe", StringComparison.OrdinalIgnoreCase) ||
                                       faylNomi.EndsWith(".docx.exe", StringComparison.OrdinalIgnoreCase);

                    bool xavfliScriptlar = faylNomi.EndsWith(".vbs", StringComparison.OrdinalIgnoreCase) ||
                                        faylNomi.EndsWith(".scr", StringComparison.OrdinalIgnoreCase);

                    if (ikkiQavatli || xavfliScriptlar)
                    {
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
                    WalkDirectory(subDir, topilganlar, barchaFayllar, ref tekshirilganFayllar);
                }
            }
            catch
            {
                // Ruxsat yo'q papkalar tashlab o'tiladi
            }
        }
    }
}