export interface LaravelSourceFile {
  path: string;
  language: 'php' | 'json' | 'markdown';
  category: 'Konfigurasi' | 'Migrasi & Seeder' | 'Model & Enum' | 'Policy RBAC' | 'Filament v5 Resource';
  summary: string;
  content: string;
}

export const LARAVEL_FILAMENT_FILES: LaravelSourceFile[] = [
  {
    path: 'composer.json',
    language: 'json',
    category: 'Konfigurasi',
    summary: 'Dependensi Laravel Framework ^11.57.0 dan Filament ^5.10.1',
    content: `{
    "$schema": "https://getcomposer.org/schema.json",
    "name": "kelurahan/siak-kependudukan",
    "type": "project",
    "description": "Sistem Informasi Administrasi Kependudukan (Laravel 11.57.0 & Filament v5.10.1)",
    "require": {
        "php": "^8.2",
        "filament/filament": "^5.10.1",
        "laravel/framework": "^11.57.0",
        "laravel/tinker": "^2.9"
    },
    "require-dev": {
        "fakerphp/faker": "^1.23",
        "laravel/pint": "^1.13",
        "phpunit/phpunit": "^11.0.1"
    },
    "autoload": {
        "psr-4": {
            "App\\\\": "app/",
            "Database\\\\Factories\\\\": "database/factories/",
            "Database\\\\Seeders\\\\": "database/seeders/"
        }
    },
    "scripts": {
        "post-autoload-dump": [
            "Illuminate\\\\Foundation\\\\ComposerScripts::postAutoloadDump",
            "@php artisan package:discover --ansi",
            "@php artisan filament:upgrade"
        ]
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}`,
  },
  {
    path: 'app/Enums/UserRole.php',
    language: 'php',
    category: 'Model & Enum',
    summary: 'Enum role pengguna: ADMIN, RT, RW, dan LURAH',
    content: `<?php

namespace App\\Enums;

use Filament\\Support\\Contracts\\HasColor;
use Filament\\Support\\Contracts\\HasLabel;

enum UserRole: string implements HasLabel, HasColor
{
    case ADMIN = 'ADMIN';
    case RT = 'RT';
    case RW = 'RW';
    case LURAH = 'LURAH';

    public function getLabel(): string
    {
        return match ($this) {
            self::ADMIN => 'Admin (All Access)',
            self::RT => 'Ketua RT (CRUD Seluruh Data Warga)',
            self::RW => 'Ketua RW (Lihat Data 1 RT)',
            self::LURAH => 'Lurah (Lihat Data RW)',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::ADMIN => 'danger',
            self::RT => 'success',
            self::RW => 'warning',
            self::LURAH => 'info',
        };
    }
}`,
  },
  {
    path: 'database/migrations/2026_01_01_000001_create_wilayah_tables.php',
    language: 'php',
    category: 'Migrasi & Seeder',
    summary: 'Migrasi tabel rws dan rts',
    content: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rws', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rw', 3)->unique();
            $table->string('ketua_rw');
            $table->string('telepon', 20)->nullable();
            $table->string('kelurahan')->default('Kelurahan Sukamaju');
            $table->timestamps();
        });

        Schema::create('rts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rw_id')->constrained('rws')->cascadeOnDelete();
            $table->string('nomor_rt', 3);
            $table->string('ketua_rt');
            $table->string('telepon', 20)->nullable();
            $table->timestamps();

            $table->unique(['rw_id', 'nomor_rt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rts');
        Schema::dropIfExists('rws');
    }
};`,
  },
  {
    path: 'database/migrations/2026_01_01_000002_add_role_and_wilayah_to_users_table.php',
    language: 'php',
    category: 'Migrasi & Seeder',
    summary: 'Menambahkan kolom role, rw_id, dan rt_id pada tabel users',
    content: `<?php

use App\\Enums\\UserRole;
use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 16)->default(UserRole::RT->value)->after('password');
            $table->foreignId('rw_id')->nullable()->after('role')->constrained('rws')->nullOnDelete();
            $table->foreignId('rt_id')->nullable()->after('rw_id')->constrained('rts')->nullOnDelete();
            $table->boolean('active')->default(true)->after('rt_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rt_id');
            $table->dropConstrainedForeignId('rw_id');
            $table->dropColumn(['role', 'active']);
        });
    }
};`,
  },
  {
    path: 'database/migrations/2026_01_01_000003_create_wargas_table.php',
    language: 'php',
    category: 'Migrasi & Seeder',
    summary: 'Migrasi tabel wargas dengan Primary Key NIK (string 16 digit)',
    content: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wargas', function (Blueprint $table) {
            // Primary Key adalah NIK (16 digit, non-incrementing string)
            $table->string('nik', 16)->primary();
            $table->string('no_kk', 16)->index();
            $table->string('nama_lengkap');
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->string('agama', 30);
            $table->string('status_perkawinan', 30);
            $table->string('pekerjaan', 100);
            $table->string('pendidikan_terakhir', 50);
            $table->string('golongan_darah', 5)->default('-');
            $table->text('alamat');
            $table->foreignId('rw_id')->constrained('rws')->cascadeOnDelete();
            $table->foreignId('rt_id')->constrained('rts')->cascadeOnDelete();
            $table->enum('status_kependudukan', ['Tetap', 'Pendatang', 'Pindah', 'Meninggal'])->default('Tetap');
            $table->string('hubungan_keluarga', 40)->default('Kepala Keluarga');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wargas');
    }
};`,
  },
  {
    path: 'database/migrations/2026_01_01_000004_create_surat_pengantars_table.php',
    language: 'php',
    category: 'Migrasi & Seeder',
    summary: 'Migrasi tabel surat_pengantars terhubung ke Primary Key NIK pada tabel wargas',
    content: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_pengantars', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_surat')->unique();
            $table->string('nik_warga', 16);
            $table->foreign('nik_warga')->references('nik')->on('wargas')->cascadeOnDelete();
            $table->string('jenis_surat');
            $table->text('keperluan');
            $table->date('tanggal_pengajuan');
            $table->enum('status', ['Menunggu', 'Disetujui', 'Diterbitkan'])->default('Diterbitkan');
            $table->string('diterbitkan_oleh');
            $table->foreignId('rw_id')->constrained('rws')->cascadeOnDelete();
            $table->foreignId('rt_id')->constrained('rts')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_pengantars');
    }
};`,
  },
  {
    path: 'app/Models/Warga.php',
    language: 'php',
    category: 'Model & Enum',
    summary: 'Model Eloquent Warga dengan Primary Key NIK (non-incrementing string)',
    content: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class Warga extends Model
{
    use HasFactory;

    protected $table = 'wargas';

    /**
     * Primary Key menggunakan NIK (16 digit).
     */
    protected $primaryKey = 'nik';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'nik',
        'no_kk',
        'nama_lengkap',
        'tempat_lahir',
        'tanggal_lahir',
        'jenis_kelamin',
        'agama',
        'status_perkawinan',
        'pekerjaan',
        'pendidikan_terakhir',
        'golongan_darah',
        'alamat',
        'rw_id',
        'rt_id',
        'status_kependudukan',
        'hubungan_keluarga',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_lahir' => 'date',
        ];
    }

    public function rw(): BelongsTo
    {
        return $this->belongsTo(Rw::class, 'rw_id');
    }

    public function rt(): BelongsTo
    {
        return $this->belongsTo(Rt::class, 'rt_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}`,
  },
  {
    path: 'app/Models/Rw.php',
    language: 'php',
    category: 'Model & Enum',
    summary: 'Model Eloquent Rw beserta relasi RT dan Warga',
    content: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

class Rw extends Model
{
    protected $fillable = ['nomor_rw', 'ketua_rw', 'telepon', 'kelurahan'];

    public function rts(): HasMany
    {
        return $this->hasMany(Rt::class, 'rw_id');
    }

    public function wargas(): HasMany
    {
        return $this->hasMany(Warga::class, 'rw_id');
    }
}`,
  },
  {
    path: 'app/Models/Rt.php',
    language: 'php',
    category: 'Model & Enum',
    summary: 'Model Eloquent Rt beserta relasi RW dan Warga',
    content: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

class Rt extends Model
{
    protected $fillable = ['rw_id', 'nomor_rt', 'ketua_rt', 'telepon'];

    public function rw(): BelongsTo
    {
        return $this->belongsTo(Rw::class, 'rw_id');
    }

    public function wargas(): HasMany
    {
        return $this->hasMany(Warga::class, 'rt_id');
    }
}`,
  },
  {
    path: 'app/Models/User.php',
    language: 'php',
    category: 'Model & Enum',
    summary: 'Model User dengan helper RBAC (ADMIN, RT, RW, LURAH) & FilamentUser',
    content: `<?php

namespace App\\Models;

use App\\Enums\\UserRole;
use Filament\\Models\\Contracts\\FilamentUser;
use Filament\\Panel;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Foundation\\Auth\\User as Authenticatable;
use Illuminate\\Notifications\\Notifiable;

class User extends Authenticatable implements FilamentUser
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'rw_id',
        'rt_id',
        'active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => UserRole::class,
            'active' => 'boolean',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return (bool) $this->active;
    }

    public function rw(): BelongsTo
    {
        return $this->belongsTo(Rw::class, 'rw_id');
    }

    public function rt(): BelongsTo
    {
        return $this->belongsTo(Rt::class, 'rt_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function isRt(): bool
    {
        return $this->role === UserRole::RT;
    }

    public function isRw(): bool
    {
        return $this->role === UserRole::RW;
    }

    public function isLurah(): bool
    {
        return $this->role === UserRole::LURAH;
    }
}`,
  },
  {
    path: 'app/Policies/WargaPolicy.php',
    language: 'php',
    category: 'Policy RBAC',
    summary: 'Policy hak akses: ADMIN all access, RT CRUD seluruh warga, RW lihat 1 RT, LURAH lihat RW',
    content: `<?php

namespace App\\Policies;

use App\\Models\\User;
use App\\Models\\Warga;

class WargaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Warga $warga): bool
    {
        if ($user->isAdmin() || $user->isRt() || $user->isLurah()) {
            return true;
        }

        // RW hanya bisa melihat data dalam lingkup RW-nya (1 RT terpilih)
        if ($user->isRw()) {
            return $warga->rw_id === $user->rw_id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        // ADMIN all access & RT CRUD seluruh data warga
        return $user->isAdmin() || $user->isRt();
    }

    public function update(User $user, Warga $warga): bool
    {
        return $user->isAdmin() || $user->isRt();
    }

    public function delete(User $user, Warga $warga): bool
    {
        return $user->isAdmin() || $user->isRt();
    }

    public function deleteAny(User $user): bool
    {
        return $user->isAdmin() || $user->isRt();
    }
}`,
  },
  {
    path: 'app/Policies/UserPolicy.php',
    language: 'php',
    category: 'Policy RBAC',
    summary: 'Policy khusus ADMIN untuk manajemen pengguna dan role',
    content: `<?php

namespace App\\Policies;

use App\\Models\\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, User $model): bool
    {
        return $user->isAdmin() && $user->id !== $model->id;
    }
}`,
  },
  {
    path: 'app/Filament/Resources/WargaResource.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Filament v5 Resource Warga dengan Schema form, Primary Key NIK, dan scoping RW (1 RT) / Lurah (RW)',
    content: `<?php

namespace App\\Filament\\Resources;

use App\\Filament\\Resources\\WargaResource\\Pages;
use App\\Models\\Rt;
use App\\Models\\Rw;
use App\\Models\\Warga;
use Filament\\Actions\\BulkActionGroup;
use Filament\\Actions\\DeleteAction;
use Filament\\Actions\\DeleteBulkAction;
use Filament\\Actions\\EditAction;
use Filament\\Actions\\ViewAction;
use Filament\\Forms\\Components\\DatePicker;
use Filament\\Forms\\Components\\Select;
use Filament\\Forms\\Components\\Textarea;
use Filament\\Forms\\Components\\TextInput;
use Filament\\Resources\\Resource;
use Filament\\Schemas\\Components\\Section;
use Filament\\Schemas\\Schema;
use Filament\\Tables\\Columns\\TextColumn;
use Filament\\Tables\\Filters\\SelectFilter;
use Filament\\Tables\\Table;
use Illuminate\\Database\\Eloquent\\Builder;
use Illuminate\\Support\\Facades\\Auth;

class WargaResource extends Resource
{
    protected static ?string $model = Warga::class;

    protected static string|\\BackedEnum|null $navigationIcon = 'heroicon-o-identification';

    protected static ?string $navigationLabel = 'Data Warga (NIK)';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'Data Warga';

    protected static ?string $pluralModelLabel = 'Data Warga';

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user = Auth::user();

        if (! $user) {
            return $query->whereRaw('1 = 0');
        }

        // RW: Melihat data 1 RT dalam wilayah RW-nya
        if ($user->isRw()) {
            $firstRtId = Rt::where('rw_id', $user->rw_id)->orderBy('nomor_rt')->value('id');
            $selectedRtId = request()->input('tableFilters.rt_id.value') ?: $firstRtId;

            return $query
                ->where('rw_id', $user->rw_id)
                ->when($selectedRtId, fn (Builder $q) => $q->where('rt_id', $selectedRtId));
        }

        // ADMIN, RT (CRUD seluruh data warga), LURAH (lihat data per RW)
        return $query;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Identitas Utama (Primary Key NIK)')
                ->columns(2)
                ->schema([
                    TextInput::make('nik')
                        ->label('NIK (Primary Key)')
                        ->required()
                        ->length(16)
                        ->regex('/^\\d{16}$/')
                        ->unique(table: Warga::class, column: 'nik', ignoreRecord: true)
                        ->disabledOn('edit')
                        ->dehydrated()
                        ->helperText('16 digit angka unik sebagai Primary Key tabel warga.'),
                    TextInput::make('no_kk')
                        ->label('Nomor Kartu Keluarga (KK)')
                        ->required()
                        ->length(16)
                        ->regex('/^\\d{16}$/'),
                    TextInput::make('nama_lengkap')
                        ->label('Nama Lengkap')
                        ->required()
                        ->maxLength(150),
                    Select::make('jenis_kelamin')
                        ->label('Jenis Kelamin')
                        ->options([
                            'Laki-laki' => 'Laki-laki',
                            'Perempuan' => 'Perempuan',
                        ])
                        ->required(),
                    TextInput::make('tempat_lahir')
                        ->label('Tempat Lahir')
                        ->required(),
                    DatePicker::make('tanggal_lahir')
                        ->label('Tanggal Lahir')
                        ->required(),
                ]),

            Section::make('Domisili Wilayah & Status Kependudukan')
                ->columns(2)
                ->schema([
                    Select::make('rw_id')
                        ->label('RW')
                        ->options(Rw::query()->orderBy('nomor_rw')->pluck('nomor_rw', 'id'))
                        ->live()
                        ->required(),
                    Select::make('rt_id')
                        ->label('RT')
                        ->options(fn (callable $get) => Rt::query()
                            ->when($get('rw_id'), fn ($q, $rwId) => $q->where('rw_id', $rwId))
                            ->orderBy('nomor_rt')
                            ->pluck('nomor_rt', 'id'))
                        ->required(),
                    Select::make('status_kependudukan')
                        ->label('Status Kependudukan')
                        ->options([
                            'Tetap' => 'Tetap',
                            'Pendatang' => 'Pendatang',
                            'Pindah' => 'Pindah',
                            'Meninggal' => 'Meninggal',
                        ])
                        ->default('Tetap')
                        ->required(),
                    Select::make('hubungan_keluarga')
                        ->label('Status Hubungan Keluarga')
                        ->options([
                            'Kepala Keluarga' => 'Kepala Keluarga',
                            'Istri' => 'Istri',
                            'Anak' => 'Anak',
                            'Orang Tua' => 'Orang Tua',
                            'Famili Lain' => 'Famili Lain',
                        ])
                        ->default('Kepala Keluarga')
                        ->required(),
                    Textarea::make('alamat')
                        ->label('Alamat Lengkap')
                        ->columnSpanFull()
                        ->required(),
                ]),

            Section::make('Data Sosial & Demografi')
                ->columns(3)
                ->schema([
                    Select::make('agama')
                        ->options([
                            'Islam' => 'Islam',
                            'Kristen' => 'Kristen',
                            'Katolik' => 'Katolik',
                            'Hindu' => 'Hindu',
                            'Buddha' => 'Buddha',
                            'Konghucu' => 'Konghucu',
                        ])
                        ->required(),
                    Select::make('status_perkawinan')
                        ->label('Status Perkawinan')
                        ->options([
                            'Belum Kawin' => 'Belum Kawin',
                            'Kawin' => 'Kawin',
                            'Cerai Hidup' => 'Cerai Hidup',
                            'Cerai Mati' => 'Cerai Mati',
                        ])
                        ->required(),
                    Select::make('golongan_darah')
                        ->label('Golongan Darah')
                        ->options(['A' => 'A', 'B' => 'B', 'AB' => 'AB', 'O' => 'O', '-' => '-'])
                        ->default('-'),
                    TextInput::make('pekerjaan')->required(),
                    TextInput::make('pendidikan_terakhir')->label('Pendidikan Terakhir')->required(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        $user = Auth::user();

        return $table
            ->columns([
                TextColumn::make('nik')
                    ->label('NIK (PK)')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->fontFamily('mono'),
                TextColumn::make('no_kk')
                    ->label('No. KK')
                    ->searchable()
                    ->fontFamily('mono')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('nama_lengkap')
                    ->label('Nama Lengkap')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('rw.nomor_rw')
                    ->label('RW')
                    ->formatStateUsing(fn ($state) => "RW {$state}")
                    ->sortable(),
                TextColumn::make('rt.nomor_rt')
                    ->label('RT')
                    ->formatStateUsing(fn ($state) => "RT {$state}")
                    ->sortable(),
                TextColumn::make('jenis_kelamin')->label('Gender'),
                TextColumn::make('status_kependudukan')
                    ->label('Status')
                    ->badge(),
            ])
            ->filters([
                SelectFilter::make('rw_id')
                    ->label('Filter RW (Lurah / Admin)')
                    ->options(Rw::query()->orderBy('nomor_rw')->pluck('nomor_rw', 'id'))
                    ->visible(fn () => ! $user?->isRw()),
                SelectFilter::make('rt_id')
                    ->label('Pilih 1 RT')
                    ->options(fn () => $user?->isRw()
                        ? Rt::where('rw_id', $user->rw_id)->orderBy('nomor_rt')->pluck('nomor_rt', 'id')
                        : Rt::query()->orderBy('nomor_rt')->pluck('nomor_rt', 'id'))
                    ->selectablePlaceholder(fn () => ! $user?->isRw()),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\\ListWargas::route('/'),
            'create' => Pages\\CreateWarga::route('/create'),
            'view' => Pages\\ViewWarga::route('/{record}'),
            'edit' => Pages\\EditWarga::route('/{record}/edit'),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/UserResource.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Filament v5 Resource Manajemen User & Role (Khusus ADMIN)',
    content: `<?php

namespace App\\Filament\\Resources;

use App\\Enums\\UserRole;
use App\\Filament\\Resources\\UserResource\\Pages;
use App\\Models\\Rt;
use App\\Models\\Rw;
use App\\Models\\User;
use Filament\\Actions\\EditAction;
use Filament\\Forms\\Components\\Select;
use Filament\\Forms\\Components\\TextInput;
use Filament\\Forms\\Components\\Toggle;
use Filament\\Resources\\Resource;
use Filament\\Schemas\\Schema;
use Filament\\Tables\\Columns\\IconColumn;
use Filament\\Tables\\Columns\\TextColumn;
use Filament\\Tables\\Table;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static string|\\BackedEnum|null $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationLabel = 'Pengguna & Role';

    protected static ?int $navigationSort = 5;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name')->label('Nama Lengkap')->required(),
            TextInput::make('email')->email()->required()->unique(ignoreRecord: true),
            TextInput::make('password')
                ->password()
                ->dehydrated(fn (?string $state): bool => filled($state))
                ->required(fn (string $operation): bool => $operation === 'create'),
            Select::make('role')
                ->options(UserRole::class)
                ->live()
                ->required(),
            Select::make('rw_id')
                ->label('Penugasan RW')
                ->options(Rw::query()->orderBy('nomor_rw')->pluck('nomor_rw', 'id'))
                ->visible(fn (callable $get) => in_array($get('role'), [UserRole::RW->value, UserRole::RT->value]))
                ->live(),
            Select::make('rt_id')
                ->label('Penugasan RT')
                ->options(fn (callable $get) => Rt::query()
                    ->when($get('rw_id'), fn ($q, $rwId) => $q->where('rw_id', $rwId))
                    ->pluck('nomor_rt', 'id'))
                ->visible(fn (callable $get) => $get('role') === UserRole::RT->value),
            Toggle::make('active')->label('Akun Aktif')->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')->label('Nama')->searchable(),
                TextColumn::make('email')->searchable(),
                TextColumn::make('role')->badge(),
                TextColumn::make('rw.nomor_rw')->label('RW')->placeholder('-'),
                TextColumn::make('rt.nomor_rt')->label('RT')->placeholder('-'),
                IconColumn::make('active')->boolean(),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\\ListUsers::route('/'),
            'create' => Pages\\CreateUser::route('/create'),
            'edit' => Pages\\EditUser::route('/{record}/edit'),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/WargaResource/Pages/ListWargas.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman daftar Data Warga',
    content: `<?php

namespace App\\Filament\\Resources\\WargaResource\\Pages;

use App\\Filament\\Resources\\WargaResource;
use Filament\\Actions\\CreateAction;
use Filament\\Resources\\Pages\\ListRecords;

class ListWargas extends ListRecords
{
    protected static string $resource = WargaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/WargaResource/Pages/CreateWarga.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman tambah Data Warga',
    content: `<?php

namespace App\\Filament\\Resources\\WargaResource\\Pages;

use App\\Filament\\Resources\\WargaResource;
use Filament\\Resources\\Pages\\CreateRecord;
use Illuminate\\Support\\Facades\\Auth;

class CreateWarga extends CreateRecord
{
    protected static string $resource = WargaResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['created_by'] = Auth::id();

        return $data;
    }
}`,
  },
  {
    path: 'app/Filament/Resources/WargaResource/Pages/ViewWarga.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman detail Data Warga',
    content: `<?php

namespace App\\Filament\\Resources\\WargaResource\\Pages;

use App\\Filament\\Resources\\WargaResource;
use Filament\\Actions\\EditAction;
use Filament\\Resources\\Pages\\ViewRecord;

class ViewWarga extends ViewRecord
{
    protected static string $resource = WargaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/WargaResource/Pages/EditWarga.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman ubah Data Warga',
    content: `<?php

namespace App\\Filament\\Resources\\WargaResource\\Pages;

use App\\Filament\\Resources\\WargaResource;
use Filament\\Actions\\DeleteAction;
use Filament\\Actions\\ViewAction;
use Filament\\Resources\\Pages\\EditRecord;

class EditWarga extends EditRecord
{
    protected static string $resource = WargaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/UserResource/Pages/ListUsers.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman daftar Pengguna & Role',
    content: `<?php

namespace App\\Filament\\Resources\\UserResource\\Pages;

use App\\Filament\\Resources\\UserResource;
use Filament\\Actions\\CreateAction;
use Filament\\Resources\\Pages\\ListRecords;

class ListUsers extends ListRecords
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/UserResource/Pages/CreateUser.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman tambah Pengguna & Role',
    content: `<?php

namespace App\\Filament\\Resources\\UserResource\\Pages;

use App\\Filament\\Resources\\UserResource;
use Filament\\Resources\\Pages\\CreateRecord;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;
}`,
  },
  {
    path: 'app/Filament/Resources/UserResource/Pages/EditUser.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman ubah Pengguna & Role',
    content: `<?php

namespace App\\Filament\\Resources\\UserResource\\Pages;

use App\\Filament\\Resources\\UserResource;
use Filament\\Actions\\DeleteAction;
use Filament\\Resources\\Pages\\EditRecord;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Policies/RwPolicy.php',
    language: 'php',
    category: 'Policy RBAC',
    summary: 'Policy wilayah RW (ADMIN CRUD, Lurah/RT baca semua, RW baca RW miliknya)',
    content: `<?php

namespace App\\Policies;

use App\\Models\\Rw;
use App\\Models\\User;

class RwPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Rw $rw): bool
    {
        if ($user->isRw()) {
            return $rw->id === $user->rw_id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Rw $rw): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Rw $rw): bool
    {
        return $user->isAdmin();
    }
}`,
  },
  {
    path: 'app/Policies/RtPolicy.php',
    language: 'php',
    category: 'Policy RBAC',
    summary: 'Policy wilayah RT (ADMIN CRUD, RW baca RT dalam RW miliknya, Lurah/RT baca semua)',
    content: `<?php

namespace App\\Policies;

use App\\Models\\Rt;
use App\\Models\\User;

class RtPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Rt $rt): bool
    {
        if ($user->isRw()) {
            return $rt->rw_id === $user->rw_id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Rt $rt): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Rt $rt): bool
    {
        return $user->isAdmin();
    }
}`,
  },
  {
    path: 'app/Filament/Resources/RwResource.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Filament v5 Resource Wilayah RW',
    content: `<?php

namespace App\\Filament\\Resources;

use App\\Filament\\Resources\\RwResource\\Pages;
use App\\Models\\Rw;
use Filament\\Actions\\EditAction;
use Filament\\Forms\\Components\\TextInput;
use Filament\\Resources\\Resource;
use Filament\\Schemas\\Schema;
use Filament\\Tables\\Columns\\TextColumn;
use Filament\\Tables\\Table;
use Illuminate\\Database\\Eloquent\\Builder;
use Illuminate\\Support\\Facades\\Auth;

class RwResource extends Resource
{
    protected static ?string $model = Rw::class;

    protected static string|\\BackedEnum|null $navigationIcon = 'heroicon-o-building-office-2';

    protected static ?string $navigationLabel = 'Wilayah RW';

    protected static ?int $navigationSort = 2;

    protected static ?string $modelLabel = 'Wilayah RW';

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user = Auth::user();

        if ($user?->isRw()) {
            return $query->where('id', $user->rw_id);
        }

        return $query;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('nomor_rw')->label('Nomor RW')->required()->maxLength(3)->unique(ignoreRecord: true),
            TextInput::make('ketua_rw')->label('Nama Ketua RW')->required(),
            TextInput::make('telepon')->label('Telepon'),
            TextInput::make('kelurahan')->default('Kelurahan Sukamaju')->required(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nomor_rw')->label('Nomor RW')->formatStateUsing(fn ($state) => "RW {$state}")->sortable(),
                TextColumn::make('ketua_rw')->label('Ketua RW')->searchable(),
                TextColumn::make('rts_count')->counts('rts')->label('Jumlah RT'),
                TextColumn::make('wargas_count')->counts('wargas')->label('Total Warga'),
                TextColumn::make('telepon')->label('Telepon'),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\\ListRws::route('/'),
            'create' => Pages\\CreateRw::route('/create'),
            'edit' => Pages\\EditRw::route('/{record}/edit'),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/RwResource/Pages/ListRws.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman daftar RW',
    content: `<?php

namespace App\\Filament\\Resources\\RwResource\\Pages;

use App\\Filament\\Resources\\RwResource;
use Filament\\Actions\\CreateAction;
use Filament\\Resources\\Pages\\ListRecords;

class ListRws extends ListRecords
{
    protected static string $resource = RwResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/RwResource/Pages/CreateRw.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman tambah RW',
    content: `<?php

namespace App\\Filament\\Resources\\RwResource\\Pages;

use App\\Filament\\Resources\\RwResource;
use Filament\\Resources\\Pages\\CreateRecord;

class CreateRw extends CreateRecord
{
    protected static string $resource = RwResource::class;
}`,
  },
  {
    path: 'app/Filament/Resources/RwResource/Pages/EditRw.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman ubah RW',
    content: `<?php

namespace App\\Filament\\Resources\\RwResource\\Pages;

use App\\Filament\\Resources\\RwResource;
use Filament\\Actions\\DeleteAction;
use Filament\\Resources\\Pages\\EditRecord;

class EditRw extends EditRecord
{
    protected static string $resource = RwResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/RtResource.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Filament v5 Resource Wilayah RT',
    content: `<?php

namespace App\\Filament\\Resources;

use App\\Filament\\Resources\\RtResource\\Pages;
use App\\Models\\Rt;
use App\\Models\\Rw;
use Filament\\Actions\\EditAction;
use Filament\\Forms\\Components\\Select;
use Filament\\Forms\\Components\\TextInput;
use Filament\\Resources\\Resource;
use Filament\\Schemas\\Schema;
use Filament\\Tables\\Columns\\TextColumn;
use Filament\\Tables\\Table;
use Illuminate\\Database\\Eloquent\\Builder;
use Illuminate\\Support\\Facades\\Auth;

class RtResource extends Resource
{
    protected static ?string $model = Rt::class;

    protected static string|\\BackedEnum|null $navigationIcon = 'heroicon-o-map-pin';

    protected static ?string $navigationLabel = 'Wilayah RT';

    protected static ?int $navigationSort = 3;

    protected static ?string $modelLabel = 'Wilayah RT';

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user = Auth::user();

        if ($user?->isRw()) {
            return $query->where('rw_id', $user->rw_id);
        }

        return $query;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('rw_id')
                ->label('RW Induk')
                ->options(Rw::query()->orderBy('nomor_rw')->pluck('nomor_rw', 'id'))
                ->required(),
            TextInput::make('nomor_rt')->label('Nomor RT')->required()->maxLength(3),
            TextInput::make('ketua_rt')->label('Nama Ketua RT')->required(),
            TextInput::make('telepon')->label('Telepon'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nomor_rt')->label('Nomor RT')->formatStateUsing(fn ($state) => "RT {$state}")->sortable(),
                TextColumn::make('rw.nomor_rw')->label('RW Induk')->formatStateUsing(fn ($state) => "RW {$state}")->sortable(),
                TextColumn::make('ketua_rt')->label('Ketua RT')->searchable(),
                TextColumn::make('wargas_count')->counts('wargas')->label('Total Warga'),
                TextColumn::make('telepon')->label('Telepon'),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\\ListRts::route('/'),
            'create' => Pages\\CreateRt::route('/create'),
            'edit' => Pages\\EditRt::route('/{record}/edit'),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/RtResource/Pages/ListRts.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman daftar RT',
    content: `<?php

namespace App\\Filament\\Resources\\RtResource\\Pages;

use App\\Filament\\Resources\\RtResource;
use Filament\\Actions\\CreateAction;
use Filament\\Resources\\Pages\\ListRecords;

class ListRts extends ListRecords
{
    protected static string $resource = RtResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/RtResource/Pages/CreateRt.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman tambah RT',
    content: `<?php

namespace App\\Filament\\Resources\\RtResource\\Pages;

use App\\Filament\\Resources\\RtResource;
use Filament\\Resources\\Pages\\CreateRecord;

class CreateRt extends CreateRecord
{
    protected static string $resource = RtResource::class;
}`,
  },
  {
    path: 'app/Filament/Resources/RtResource/Pages/EditRt.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman ubah RT',
    content: `<?php

namespace App\\Filament\\Resources\\RtResource\\Pages;

use App\\Filament\\Resources\\RtResource;
use Filament\\Actions\\DeleteAction;
use Filament\\Resources\\Pages\\EditRecord;

class EditRt extends EditRecord
{
    protected static string $resource = RtResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Widgets/KependudukanStatsOverview.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Widget Statistik Kependudukan sesuai role (Admin, RT, RW 1-RT, Lurah)',
    content: `<?php

namespace App\\Filament\\Widgets;

use App\\Models\\Rt;
use App\\Models\\Rw;
use App\\Models\\Warga;
use Filament\\Widgets\\StatsOverviewWidget;
use Filament\\Widgets\\StatsOverviewWidget\\Stat;
use Illuminate\\Support\\Facades\\Auth;

class KependudukanStatsOverview extends StatsOverviewWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $user = Auth::user();
        $query = Warga::query();
        $scopeLabel = 'Seluruh Kelurahan';

        if ($user?->isRw()) {
            $firstRt = Rt::where('rw_id', $user->rw_id)->orderBy('nomor_rt')->first();
            $query->where('rw_id', $user->rw_id)
                ->when($firstRt, fn ($q) => $q->where('rt_id', $firstRt->id));
            $scopeLabel = $firstRt ? "RW {$user->rw?->nomor_rw} · RT {$firstRt->nomor_rt}" : 'Wilayah RW';
        }

        $totalWarga = (clone $query)->count();
        $totalKk = (clone $query)->distinct('no_kk')->count('no_kk');
        $lakiLaki = (clone $query)->where('jenis_kelamin', 'Laki-laki')->count();
        $perempuan = (clone $query)->where('jenis_kelamin', 'Perempuan')->count();
        $totalRw = $user?->isRw() ? 1 : Rw::count();
        $totalRt = $user?->isRw() ? Rt::where('rw_id', $user->rw_id)->count() : Rt::count();

        return [
            Stat::make('Total Penduduk (NIK PK)', $totalWarga)
                ->description($scopeLabel)
                ->color('warning'),
            Stat::make('Jumlah Kartu Keluarga', $totalKk)
                ->description('Berdasarkan No. KK unik')
                ->color('primary'),
            Stat::make('Laki-laki / Perempuan', "{$lakiLaki} / {$perempuan}")
                ->description('Komposisi jenis kelamin')
                ->color('success'),
            Stat::make('Wilayah Administratif', "{$totalRw} RW · {$totalRt} RT")
                ->description('Role: ' . ($user?->role?->getLabel() ?? '-'))
                ->color('info'),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Widgets/RekapWilayahTableWidget.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Widget Tabel Rekapitulasi Penduduk Per RW / RT pada Dashboard',
    content: `<?php

namespace App\\Filament\\Widgets;

use App\\Models\\Rt;
use App\\Models\\Rw;
use Filament\\Tables\\Columns\\TextColumn;
use Filament\\Tables\\Table;
use Filament\\Widgets\\TableWidget;
use Illuminate\\Support\\Facades\\Auth;

class RekapWilayahTableWidget extends TableWidget
{
    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        $user = Auth::user();

        if ($user?->isRw()) {
            return $table
                ->heading('Rekapitulasi RT di Wilayah RW Anda')
                ->query(Rt::query()->where('rw_id', $user->rw_id)->withCount('wargas'))
                ->columns([
                    TextColumn::make('nomor_rt')->label('RT')->formatStateUsing(fn ($state) => "RT {$state}"),
                    TextColumn::make('ketua_rt')->label('Ketua RT'),
                    TextColumn::make('wargas_count')->label('Jumlah Warga'),
                ]);
        }

        return $table
            ->heading('Rekapitulasi Penduduk Per RW')
            ->query(Rw::query()->withCount(['rts', 'wargas']))
            ->columns([
                TextColumn::make('nomor_rw')->label('RW')->formatStateUsing(fn ($state) => "RW {$state}"),
                TextColumn::make('ketua_rw')->label('Ketua RW'),
                TextColumn::make('rts_count')->label('Jumlah RT'),
                TextColumn::make('wargas_count')->label('Total Warga'),
            ]);
    }
}`,
  },
  {
    path: 'app/Models/SuratPengantar.php',
    language: 'php',
    category: 'Model & Enum',
    summary: 'Model SuratPengantar dengan relasi ke Warga (NIK PK), RW, dan RT',
    content: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class SuratPengantar extends Model
{
    protected $fillable = [
        'nomor_surat',
        'nik_warga',
        'jenis_surat',
        'keperluan',
        'tanggal_pengajuan',
        'status',
        'diterbitkan_oleh',
        'rw_id',
        'rt_id',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pengajuan' => 'date',
        ];
    }

    public function warga(): BelongsTo
    {
        return $this->belongsTo(Warga::class, 'nik_warga', 'nik');
    }

    public function rw(): BelongsTo
    {
        return $this->belongsTo(Rw::class, 'rw_id');
    }

    public function rt(): BelongsTo
    {
        return $this->belongsTo(Rt::class, 'rt_id');
    }
}`,
  },
  {
    path: 'app/Policies/SuratPengantarPolicy.php',
    language: 'php',
    category: 'Policy RBAC',
    summary: 'Policy SuratPengantar (ADMIN & RT terbitkan surat, RW/LURAH baca sesuai wilayah)',
    content: `<?php

namespace App\\Policies;

use App\\Models\\SuratPengantar;
use App\\Models\\User;

class SuratPengantarPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SuratPengantar $surat): bool
    {
        if ($user->isRw()) {
            return $surat->rw_id === $user->rw_id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isRt();
    }

    public function update(User $user, SuratPengantar $surat): bool
    {
        return $user->isAdmin() || $user->isRt();
    }

    public function delete(User $user, SuratPengantar $surat): bool
    {
        return $user->isAdmin() || $user->isRt();
    }
}`,
  },
  {
    path: 'app/Filament/Resources/SuratPengantarResource.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Filament v5 Resource Surat Pengantar berbasis NIK dengan tombol Cetak Surat',
    content: `<?php

namespace App\\Filament\\Resources;

use App\\Filament\\Resources\\SuratPengantarResource\\Pages;
use App\\Models\\Rt;
use App\\Models\\SuratPengantar;
use App\\Models\\Warga;
use Filament\\Actions\\Action;
use Filament\\Actions\\EditAction;
use Filament\\Forms\\Components\\DatePicker;
use Filament\\Forms\\Components\\Select;
use Filament\\Forms\\Components\\Textarea;
use Filament\\Forms\\Components\\TextInput;
use Filament\\Resources\\Resource;
use Filament\\Schemas\\Schema;
use Filament\\Tables\\Columns\\TextColumn;
use Filament\\Tables\\Table;
use Illuminate\\Database\\Eloquent\\Builder;
use Illuminate\\Support\\Facades\\Auth;

class SuratPengantarResource extends Resource
{
    protected static ?string $model = SuratPengantar::class;

    protected static string|\\BackedEnum|null $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationLabel = 'Surat Pengantar';

    protected static ?int $navigationSort = 4;

    protected static ?string $modelLabel = 'Surat Pengantar';

    protected static ?string $pluralModelLabel = 'Surat Pengantar';

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user = Auth::user();

        if ($user?->isRw()) {
            $firstRtId = Rt::where('rw_id', $user->rw_id)->orderBy('nomor_rt')->value('id');

            return $query->where('rw_id', $user->rw_id)
                ->when($firstRtId, fn (Builder $q) => $q->where('rt_id', $firstRtId));
        }

        return $query;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('nik_warga')
                ->label('Warga (NIK Primary Key)')
                ->options(fn () => Warga::query()
                    ->orderBy('nama_lengkap')
                    ->get()
                    ->mapWithKeys(fn (Warga $w) => [$w->nik => "{$w->nik} — {$w->nama_lengkap}"]))
                ->searchable()
                ->required(),
            Select::make('jenis_surat')
                ->label('Jenis Surat')
                ->options([
                    'Surat Keterangan Domisili' => 'Surat Keterangan Domisili',
                    'Surat Pengantar KTP / KK' => 'Surat Pengantar KTP / KK',
                    'Surat Keterangan Usaha' => 'Surat Keterangan Usaha',
                    'Surat Keterangan Tidak Mampu' => 'Surat Keterangan Tidak Mampu',
                    'Surat Pengantar Pindah' => 'Surat Pengantar Pindah',
                ])
                ->required(),
            TextInput::make('nomor_surat')
                ->label('Nomor Surat')
                ->default(fn () => '470/' . str_pad((string) (SuratPengantar::count() + 14), 3, '0', STR_PAD_LEFT) . '/KEL-SMJ/' . date('Y'))
                ->required()
                ->unique(ignoreRecord: true),
            DatePicker::make('tanggal_pengajuan')
                ->label('Tanggal Pengajuan')
                ->default(now())
                ->required(),
            Select::make('status')
                ->options([
                    'Menunggu' => 'Menunggu',
                    'Disetujui' => 'Disetujui',
                    'Diterbitkan' => 'Diterbitkan',
                ])
                ->default('Diterbitkan')
                ->required(),
            Textarea::make('keperluan')
                ->label('Keperluan')
                ->columnSpanFull()
                ->required(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nomor_surat')->label('Nomor Surat')->searchable()->fontFamily('mono'),
                TextColumn::make('nik_warga')->label('NIK Warga')->searchable()->fontFamily('mono'),
                TextColumn::make('warga.nama_lengkap')->label('Nama Warga')->searchable(),
                TextColumn::make('jenis_surat')->label('Jenis Surat'),
                TextColumn::make('tanggal_pengajuan')->label('Tanggal')->date('d M Y'),
                TextColumn::make('status')->badge(),
            ])
            ->recordActions([
                Action::make('cetak')
                    ->label('Cetak')
                    ->icon('heroicon-o-printer')
                    ->url(fn (SuratPengantar $record) => route('surat.cetak', $record))
                    ->openUrlInNewTab(),
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\\ListSuratPengantars::route('/'),
            'create' => Pages\\CreateSuratPengantar::route('/create'),
            'edit' => Pages\\EditSuratPengantar::route('/{record}/edit'),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/SuratPengantarResource/Pages/ListSuratPengantars.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman daftar Surat Pengantar',
    content: `<?php

namespace App\\Filament\\Resources\\SuratPengantarResource\\Pages;

use App\\Filament\\Resources\\SuratPengantarResource;
use Filament\\Actions\\CreateAction;
use Filament\\Resources\\Pages\\ListRecords;

class ListSuratPengantars extends ListRecords
{
    protected static string $resource = SuratPengantarResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}`,
  },
  {
    path: 'app/Filament/Resources/SuratPengantarResource/Pages/CreateSuratPengantar.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman terbitkan Surat Pengantar baru',
    content: `<?php

namespace App\\Filament\\Resources\\SuratPengantarResource\\Pages;

use App\\Filament\\Resources\\SuratPengantarResource;
use App\\Models\\Warga;
use Filament\\Resources\\Pages\\CreateRecord;
use Illuminate\\Support\\Facades\\Auth;

class CreateSuratPengantar extends CreateRecord
{
    protected static string $resource = SuratPengantarResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $warga = Warga::findOrFail($data['nik_warga']);
        $data['rw_id'] = $warga->rw_id;
        $data['rt_id'] = $warga->rt_id;
        $data['diterbitkan_oleh'] = Auth::user()?->name ?? 'Petugas Kelurahan';

        return $data;
    }
}`,
  },
  {
    path: 'app/Filament/Resources/SuratPengantarResource/Pages/EditSuratPengantar.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Halaman ubah Surat Pengantar',
    content: `<?php

namespace App\\Filament\\Resources\\SuratPengantarResource\\Pages;

use App\\Filament\\Resources\\SuratPengantarResource;
use Filament\\Actions\\DeleteAction;
use Filament\\Resources\\Pages\\EditRecord;

class EditSuratPengantar extends EditRecord
{
    protected static string $resource = SuratPengantarResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}`,
  },
  {
    path: 'resources/views/surat/cetak.blade.php',
    language: 'php',
    category: 'Filament v5 Resource',
    summary: 'Template cetak resmi Surat Pengantar berbasis NIK',
    content: `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $surat->jenis_surat }} - {{ $surat->nomor_surat }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #111827; max-width: 720px; margin: 40px auto; line-height: 1.6; }
        .kop { text-align: center; border-bottom: 3px solid #111827; padding-bottom: 12px; margin-bottom: 24px; }
        .judul { text-align: center; margin-bottom: 24px; }
        .judul h2 { margin: 0; text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        td { padding: 4px 6px; vertical-align: top; }
        .ttd { margin-top: 48px; text-align: right; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 16px;">
        <button onclick="window.print()">Cetak Surat</button>
    </div>
    <div class="kop">
        <div><strong>PEMERINTAH KELURAHAN SUKAMAJU</strong></div>
        <div><strong>RT {{ $surat->rt->nomor_rt ?? '-' }} / RW {{ $surat->rw->nomor_rw ?? '-' }}</strong></div>
    </div>
    <div class="judul">
        <h2>{{ $surat->jenis_surat }}</h2>
        <div>Nomor: {{ $surat->nomor_surat }}</div>
    </div>
    <p>Yang bertanda tangan di bawah ini menerangkan dengan sebenarnya bahwa:</p>
    <table>
        <tr><td style="width: 180px;">Nama Lengkap</td><td>: <strong>{{ $surat->warga->nama_lengkap ?? '-' }}</strong></td></tr>
        <tr><td>NIK (Primary Key)</td><td>: {{ $surat->nik_warga }}</td></tr>
        <tr><td>Alamat</td><td>: {{ $surat->warga->alamat ?? '-' }}</td></tr>
        <tr><td>Keperluan</td><td>: {{ $surat->keperluan }}</td></tr>
    </table>
    <p>Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
    <div class="ttd">
        <div>Diterbitkan tanggal {{ $surat->tanggal_pengajuan?->format('d-m-Y') }}</div>
        <div style="margin-top: 64px;"><strong>{{ $surat->diterbitkan_oleh }}</strong></div>
    </div>
</body>
</html>`,
  },
  {
    path: 'routes/web.php',
    language: 'php',
    category: 'Konfigurasi',
    summary: 'Route cetak Surat Pengantar dan redirect halaman utama ke /admin',
    content: `<?php

use App\\Models\\SuratPengantar;
use Illuminate\\Support\\Facades\\Route;

Route::get('/', fn () => redirect('/admin'));

Route::get('/surat/{surat}/cetak', function (SuratPengantar $surat) {
    $surat->load(['warga', 'rw', 'rt']);

    return view('surat.cetak', compact('surat'));
})->middleware('auth')->name('surat.cetak');`,
  },
  {
    path: 'app/Providers/Filament/AdminPanelProvider.php',
    language: 'php',
    category: 'Konfigurasi',
    summary: 'Konfigurasi Filament v5 AdminPanelProvider dengan tema terang, brand SIAK Kelurahan, dan widget kependudukan',
    content: `<?php

namespace App\\Providers\\Filament;

use App\\Filament\\Widgets\\KependudukanStatsOverview;
use App\\Filament\\Widgets\\RekapWilayahTableWidget;
use Filament\\Http\\Middleware\\Authenticate;
use Filament\\Http\\Middleware\\DisableBladeIconComponents;
use Filament\\Http\\Middleware\\DispatchServingFilamentEvent;
use Filament\\Pages\\Dashboard;
use Filament\\Panel;
use Filament\\PanelProvider;
use Filament\\Support\\Colors\\Color;
use Filament\\Widgets\\AccountWidget;
use Illuminate\\Cookie\\Middleware\\AddQueuedCookiesToResponse;
use Illuminate\\Cookie\\Middleware\\EncryptCookies;
use Illuminate\\Foundation\\Http\\Middleware\\VerifyCsrfToken;
use Illuminate\\Routing\\Middleware\\SubstituteBindings;
use Illuminate\\Session\\Middleware\\StartSession;
use Illuminate\\View\\Middleware\\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->brandName('SIAK Kelurahan')
            ->darkMode(false)
            ->colors([
                'primary' => Color::Amber,
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\\\Filament\\\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\\\Filament\\\\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\\\Filament\\\\Widgets')
            ->widgets([
                AccountWidget::class,
                KependudukanStatsOverview::class,
                RekapWilayahTableWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}`,
  },
  {
    path: 'database/seeders/DatabaseSeeder.php',
    language: 'php',
    category: 'Migrasi & Seeder',
    summary: 'Seeder lengkap 3 RW, 6 RT, 6 User, 12 Data Warga (NIK PK), dan 3 Surat Pengantar',
    content: `<?php

namespace Database\\Seeders;

use App\\Enums\\UserRole;
use App\\Models\\Rt;
use App\\Models\\Rw;
use App\\Models\\SuratPengantar;
use App\\Models\\User;
use App\\Models\\Warga;
use Illuminate\\Database\\Seeder;
use Illuminate\\Support\\Facades\\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $rw1 = Rw::create(['nomor_rw' => '001', 'ketua_rw' => 'Hendra Wijaya', 'telepon' => '081234560001', 'kelurahan' => 'Kelurahan Sukamaju']);
        $rw2 = Rw::create(['nomor_rw' => '002', 'ketua_rw' => 'Bambang Sutrisno', 'telepon' => '081234560002', 'kelurahan' => 'Kelurahan Sukamaju']);
        $rw3 = Rw::create(['nomor_rw' => '003', 'ketua_rw' => 'Rahmat Hidayat', 'telepon' => '081234560003', 'kelurahan' => 'Kelurahan Sukamaju']);

        $rt11 = Rt::create(['rw_id' => $rw1->id, 'nomor_rt' => '001', 'ketua_rt' => 'Budi Santoso', 'telepon' => '081355001101']);
        $rt12 = Rt::create(['rw_id' => $rw1->id, 'nomor_rt' => '002', 'ketua_rt' => 'Siti Aminah', 'telepon' => '081355001102']);
        $rt13 = Rt::create(['rw_id' => $rw1->id, 'nomor_rt' => '003', 'ketua_rt' => 'Agus Pratama', 'telepon' => '081355001103']);
        $rt21 = Rt::create(['rw_id' => $rw2->id, 'nomor_rt' => '001', 'ketua_rt' => 'Dewi Lestari', 'telepon' => '081355002201']);
        $rt22 = Rt::create(['rw_id' => $rw2->id, 'nomor_rt' => '002', 'ketua_rt' => 'Eko Purnomo', 'telepon' => '081355002202']);
        $rt31 = Rt::create(['rw_id' => $rw3->id, 'nomor_rt' => '001', 'ketua_rt' => 'Nurul Huda', 'telepon' => '081355003301']);

        $admin = User::create(['name' => 'Drs. Wahyu Nugroho', 'email' => 'admin@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::ADMIN]);
        $uRt1 = User::create(['name' => 'Budi Santoso (Ketua RT 001)', 'email' => 'rt01.rw01@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::RT, 'rw_id' => $rw1->id, 'rt_id' => $rt11->id]);
        User::create(['name' => 'Siti Aminah (Ketua RT 002)', 'email' => 'rt02.rw01@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::RT, 'rw_id' => $rw1->id, 'rt_id' => $rt12->id]);
        User::create(['name' => 'Hendra Wijaya (Ketua RW 001)', 'email' => 'rw01@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::RW, 'rw_id' => $rw1->id]);
        User::create(['name' => 'Bambang Sutrisno (Ketua RW 002)', 'email' => 'rw02@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::RW, 'rw_id' => $rw2->id]);
        User::create(['name' => 'Hj. Ratna Kusuma (Lurah)', 'email' => 'lurah@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::LURAH]);

        $rows = [
            ['3578041508850001', '3578040101120011', 'Ahmad Fauzan', 'Surabaya', '1985-08-15', 'Laki-laki', 'Islam', 'Kawin', 'Pegawai Swasta', 'S1', 'O', 'Jl. Melati No. 14', $rw1->id, $rt11->id, 'Tetap', 'Kepala Keluarga'],
            ['3578045203880002', '3578040101120011', 'Rina Marlina', 'Sidoarjo', '1988-03-12', 'Perempuan', 'Islam', 'Kawin', 'Guru SD', 'S1', 'A', 'Jl. Melati No. 14', $rw1->id, $rt11->id, 'Tetap', 'Istri'],
            ['3578042209790004', '3578040205140022', 'Slamet Riyadi', 'Malang', '1979-09-22', 'Laki-laki', 'Islam', 'Kawin', 'Wiraswasta', 'SMA/SMK', 'B', 'Jl. Melati No. 21', $rw1->id, $rt11->id, 'Tetap', 'Kepala Keluarga'],
            ['3578040504950006', '3578040809230033', 'Daniel Kurniawan', 'Semarang', '1995-04-05', 'Laki-laki', 'Kristen', 'Belum Kawin', 'Analis Sistem', 'S1', 'AB', 'Jl. Melati Gang II No. 7', $rw1->id, $rt11->id, 'Pendatang', 'Kepala Keluarga'],
            ['3578041807840007', '3578041203150044', 'Haryanto Wibowo', 'Gresik', '1984-07-18', 'Laki-laki', 'Islam', 'Kawin', 'Karyawan BUMN', 'S1', 'A', 'Jl. Kenanga No. 08', $rw1->id, $rt12->id, 'Tetap', 'Kepala Keluarga'],
            ['3578045511860008', '3578041203150044', 'Nadia Puspitasari', 'Surabaya', '1986-11-15', 'Perempuan', 'Islam', 'Kawin', 'Apoteker', 'S1', 'O', 'Jl. Kenanga No. 08', $rw1->id, $rt12->id, 'Tetap', 'Istri'],
            ['3578040912910010', '3578041908210066', 'Rizky Ramadhan', 'Surabaya', '1991-12-09', 'Laki-laki', 'Islam', 'Kawin', 'Teknisi Jaringan', 'D3', 'A', 'Jl. Cempaka No. 03', $rw1->id, $rt13->id, 'Tetap', 'Kepala Keluarga'],
            ['3578041410800012', '3578040501130077', 'Yohanes Setiawan', 'Surabaya', '1980-10-14', 'Laki-laki', 'Katolik', 'Kawin', 'Akuntan', 'S1', 'AB', 'Jl. Anggrek Blok A-05', $rw2->id, $rt21->id, 'Tetap', 'Kepala Keluarga'],
            ['3578045804830013', '3578040501130077', 'Maria Magdalena', 'Yogyakarta', '1983-04-18', 'Perempuan', 'Katolik', 'Kawin', 'Perawat', 'S1', 'A', 'Jl. Anggrek Blok A-05', $rw2->id, $rt21->id, 'Tetap', 'Istri'],
            ['3578040301750015', '3578041111110099', 'Supriadi', 'Lamongan', '1975-01-03', 'Laki-laki', 'Islam', 'Kawin', 'Sopir Logistik', 'SMP', 'B', 'Jl. Flamboyan No. 11', $rw2->id, $rt22->id, 'Tetap', 'Kepala Keluarga'],
            ['3578041905870017', '3578041506180101', 'Hendra Kusuma', 'Surabaya', '1987-05-19', 'Laki-laki', 'Buddha', 'Kawin', 'Wiraswasta', 'S1', 'A', 'Jl. Teratai No. 02', $rw3->id, $rt31->id, 'Tetap', 'Kepala Keluarga'],
            ['3578046209900018', '3578041506180101', 'Melissa Wijaya', 'Surabaya', '1990-09-22', 'Perempuan', 'Buddha', 'Kawin', 'Ibu Rumah Tangga', 'S1', 'B', 'Jl. Teratai No. 02', $rw3->id, $rt31->id, 'Tetap', 'Istri'],
        ];

        foreach ($rows as $r) {
            Warga::create([
                'nik' => $r[0],
                'no_kk' => $r[1],
                'nama_lengkap' => $r[2],
                'tempat_lahir' => $r[3],
                'tanggal_lahir' => $r[4],
                'jenis_kelamin' => $r[5],
                'agama' => $r[6],
                'status_perkawinan' => $r[7],
                'pekerjaan' => $r[8],
                'pendidikan_terakhir' => $r[9],
                'golongan_darah' => $r[10],
                'alamat' => $r[11],
                'rw_id' => $r[12],
                'rt_id' => $r[13],
                'status_kependudukan' => $r[14],
                'hubungan_keluarga' => $r[15],
                'created_by' => $uRt1->id ?? $admin->id,
            ]);
        }

        SuratPengantar::create([
            'nomor_surat' => '470/014/RT001-RW001/XI/2026',
            'nik_warga' => '3578040504950006',
            'jenis_surat' => 'Surat Keterangan Domisili',
            'keperluan' => 'Persyaratan administrasi perbankan dan domisili tempat tinggal',
            'tanggal_pengajuan' => '2026-11-12',
            'status' => 'Diterbitkan',
            'diterbitkan_oleh' => 'Budi Santoso (Ketua RT 001)',
            'rw_id' => $rw1->id,
            'rt_id' => $rt11->id,
        ]);

        SuratPengantar::create([
            'nomor_surat' => '470/015/RT002-RW001/XI/2026',
            'nik_warga' => '3578041807840007',
            'jenis_surat' => 'Surat Pengantar KTP / KK',
            'keperluan' => 'Pembaruan Kartu Keluarga karena penambahan anggota keluarga',
            'tanggal_pengajuan' => '2026-11-14',
            'status' => 'Diterbitkan',
            'diterbitkan_oleh' => 'Siti Aminah (Ketua RT 002)',
            'rw_id' => $rw1->id,
            'rt_id' => $rt12->id,
        ]);
    }
}`,
  },
  {
    path: 'README.md',
    language: 'markdown',
    category: 'Konfigurasi',
    summary: 'Panduan instalasi proyek Laravel 11.57.0 & Filament v5.10.1',
    content: `# SIAK Kelurahan — Laravel 11.57.0 & Filament v5.10.1

Sistem Informasi Administrasi Kependudukan berbasis **NIK sebagai Primary Key** dengan pembagian hak akses bertingkat:

- **ADMIN**: All Access (Manajemen User, RW, RT, dan seluruh Data Warga)
- **RT**: CRUD seluruh data warga
- **RW**: Melihat data 1 RT dalam wilayah RW-nya (Read-Only)
- **LURAH**: Melihat data per RW di tingkat kelurahan (Read-Only)

## Instalasi Lokal (PHP 8.2+ & Composer)

\`\`\`bash
composer create-project laravel/laravel:^11.57.0 siak-kelurahan
cd siak-kelurahan
composer require filament/filament:^5.10.1
php artisan filament:install --panels
\`\`\`

Salin seluruh file dari arsip ini ke direktori proyek Laravel Anda, lalu jalankan:

\`\`\`bash
php artisan migrate --seed
php artisan serve
\`\`\`

Buka \`http://127.0.0.1:8000/admin\` dan login menggunakan salah satu akun seeder (kata sandi default: \`password123\`):
- Admin: \`admin@kelurahan.go.id\`
- RT: \`rt01.rw01@kelurahan.go.id\`
- RW: \`rw01@kelurahan.go.id\`
- Lurah: \`lurah@kelurahan.go.id\`
`,
  },
];
