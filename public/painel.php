<?php
session_start();
$usuarios = [
    "admin" => ["senha" => "15052017", "permissao" => "total"],
    "leitor" => ["senha" => "leitor123", "permissao" => "leitura"]
];

function logar($msg) {
    file_put_contents("logs.txt", date('Y-m-d H:i:s') . " - $msg\n", FILE_APPEND);
}

if (!isset($_SESSION['logado'])) {
    if (isset($_POST['usuario'], $_POST['senha']) && isset($usuarios[$_POST['usuario']]) && $usuarios[$_POST['usuario']]['senha'] === $_POST['senha']) {
        $_SESSION['logado'] = $_POST['usuario'];
        $_SESSION['permissao'] = $usuarios[$_POST['usuario']]['permissao'];
        logar("LOGIN de {$_POST['usuario']}");
    } else {
        echo '<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Login</title><style>
        body { background: #0a0f1c; color: #90caf9; font-family: sans-serif; text-align: center; padding: 50px; }
        input, button { padding: 10px; margin: 10px; font-size: 16px; width: 80%; max-width: 300px; background: #101d3c; border: 1px solid #2c3e50; color: #fff; border-radius: 5px; }
        button:hover { background: #1e2f50; }
        </style></head><body>
        <h2>🔐 Login</h2>
        <form method="post">
            <input name="usuario" placeholder="Usuário"><br>
            <input type="password" name="senha" placeholder="Senha"><br>
            <button>Entrar</button>
        </form></body></html>';
        exit;
    }
}

if (isset($_GET['logout'])) {
    logar("LOGOUT de {$_SESSION['logado']}");
    session_destroy();
    header("Location: ?");
    exit;
}

$dir = isset($_GET['dir']) ? realpath($_GET['dir']) : getcwd();
if (!is_dir($dir)) $dir = getcwd();

if (isset($_GET['download'])) {
    $arquivo = $dir . DIRECTORY_SEPARATOR . basename($_GET['download']);
    if (file_exists($arquivo)) {
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . basename($arquivo) . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($arquivo));
        readfile($arquivo);
        exit;
    } else {
        echo "Arquivo não encontrado.";
        exit;
    }
}

function excluirTudo($alvo) {
    if (is_file($alvo) || is_link($alvo)) return unlink($alvo);
    if (is_dir($alvo)) {
        foreach (array_diff(scandir($alvo), ['.', '..']) as $item) {
            excluirTudo($alvo . DIRECTORY_SEPARATOR . $item);
        }
        return rmdir($alvo);
    }
    return false;
}

function listarPastas($dir) {
    return array_filter(scandir($dir), fn($item) => $item !== '.' && $item !== '..' && is_dir($dir . DIRECTORY_SEPARATOR . $item));
}

function listarArquivos($dir) {
    $itens = scandir($dir);
    $extEditor = ['html', 'php', 'txt', 'json'];
    foreach ($itens as $item) {
        if ($item === '.') continue;
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        echo "<tr>";
        if ($_SESSION['permissao'] === 'total') {
            echo "<td><input type='checkbox' name='selecionados[]' value='" . htmlspecialchars($item) . "'></td>";
        }

        $ext = strtolower(pathinfo($item, PATHINFO_EXTENSION));
        $nomeExib = htmlspecialchars($item);

        if (is_dir($path)) {
            echo "<td>📁 <a href='?dir=" . urlencode($path) . "'>$nomeExib</a></td>";
        } elseif (in_array($ext, $extEditor)) {
            echo "<td>📄 <a href='?dir=" . urlencode($dir) . "&abrir=" . urlencode($item) . "'>$nomeExib</a></td>";
        } else {
            echo "<td>📄 $nomeExib</td>";
        }

        echo "<td>" . filesize($path) . " bytes</td><td>";
        if ($_SESSION['permissao'] === 'total') {
            echo "<a href='?dir=" . urlencode($dir) . "&del=" . urlencode($item) . "' onclick='return confirm(\"Excluir $item?\")'>🗑</a> | ";
            echo "<a href='?dir=" . urlencode($dir) . "&ren=" . urlencode($item) . "'>✏️</a> | ";
            echo "<a href='?dir=" . urlencode($dir) . "&download=" . urlencode($item) . "'>⬇️</a> | ";
            echo "<a href='?dir=" . urlencode($dir) . "&move=" . urlencode($item) . "'>📂</a>";
        } else {
            echo "<a href='?dir=" . urlencode($dir) . "&download=" . urlencode($item) . "'>⬇️</a>";
        }
        echo "</td></tr>";
    }
}

if ($_SESSION['permissao'] === 'total') {
    if (isset($_POST['criar'], $_POST['tipo'])) {
        $novo = $dir . DIRECTORY_SEPARATOR . basename($_POST['criar']);
        $_POST['tipo'] === 'arquivo' ? file_put_contents($novo, '') : mkdir($novo);
        logar("CRIADO: $novo");
        header("Location: ?dir=" . urlencode($dir));
        exit;
    }

    if (!empty($_FILES['arquivos'])) {
        foreach ($_FILES['arquivos']['tmp_name'] as $key => $tmp) {
            $destino = $dir . DIRECTORY_SEPARATOR . basename($_FILES['arquivos']['name'][$key]);
            move_uploaded_file($tmp, $destino);
            logar("UPLOAD: $destino");
        }
        header("Location: ?dir=" . urlencode($dir));
        exit;
    }

    if (isset($_GET['del'])) {
        $alvo = $dir . DIRECTORY_SEPARATOR . $_GET['del'];
        excluirTudo($alvo);
        logar("EXCLUÍDO: {$_GET['del']}");
        header("Location: ?dir=" . urlencode($dir));
        exit;
    }

    if (isset($_GET['ren'], $_POST['novo_nome'])) {
        rename($dir . DIRECTORY_SEPARATOR . $_GET['ren'], $dir . DIRECTORY_SEPARATOR . $_POST['novo_nome']);
        logar("RENOMEADO: {$_GET['ren']} => {$_POST['novo_nome']}");
        header("Location: ?dir=" . urlencode($dir));
        exit;
    }

    if (isset($_GET['move'], $_POST['destino'])) {
        rename($dir . DIRECTORY_SEPARATOR . $_GET['move'], $_POST['destino'] . DIRECTORY_SEPARATOR . $_GET['move']);
        logar("MOVIDO: {$_GET['move']} => {$_POST['destino']}");
        header("Location: ?dir=" . urlencode($dir));
        exit;
    }

    if (isset($_POST['destino_multi'], $_POST['selecionados'])) {
        foreach ($_POST['selecionados'] as $item) {
            $origem = $dir . DIRECTORY_SEPARATOR . $item;
            $destino = rtrim($_POST['destino_multi'], DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $item;
            rename($origem, $destino);
            logar("MOVIDO MULTI: $item => $destino");
        }
        header("Location: ?dir=" . urlencode($dir));
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gerenciador</title>
<style>
body {
    background: #0a0f1c;
    color: #90caf9;
    font-family: Arial, sans-serif;
    padding: 15px;
}
input, button, select, textarea {
    background: #101d3c;
    color: #fff;
    border: 1px solid #2c3e50;
    padding: 10px;
    margin: 5px 0;
    font-size: 16px;
    width: 100%;
    border-radius: 5px;
}
textarea {
    font-family: monospace;
    font-size: 14px;
}
table {
    width: 100%;
    border-collapse: collapse;
    background: #101d3c;
}
th, td {
    border: 1px solid #2c3e50;
    padding: 10px;
    text-align: left;
    word-wrap: break-word;
}
a {
    color: #64b5f6;
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
.breadcrumbs {
    background: #0e1a30;
    padding: 10px;
    border-radius: 5px;
    font-size: 14px;
    margin-bottom: 10px;
}
button:hover {
    background-color: #1c2e50;
}
</style>
</head>
<body>
<h2>📁 Gerenciador</h2>
<p><a href="?">🏠 Raiz</a> | Usuário: <?= $_SESSION['logado'] ?> | <a href="?logout">Sair</a></p>

<div class="breadcrumbs">
    <strong>Caminho atual:</strong> <?= htmlspecialchars($dir) ?>
</div>

<?php
if (isset($_GET['abrir']) && $_SESSION['permissao'] === 'total') {
    $arquivoEdit = $dir . DIRECTORY_SEPARATOR . $_GET['abrir'];
    $ext = strtolower(pathinfo($arquivoEdit, PATHINFO_EXTENSION));
    if (in_array($ext, ['html','php','txt','json']) && file_exists($arquivoEdit) && is_file($arquivoEdit)) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['conteudo'])) {
            file_put_contents($arquivoEdit, $_POST['conteudo']);
            logar("EDITADO: {$_GET['abrir']}");
            echo "<p style='color: #4caf50;'>Arquivo salvo com sucesso!</p>";
        }
        $rawContent = file_get_contents($arquivoEdit);
        if ($ext === 'json') {
            $jsonDecoded = json_decode($rawContent, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $conteudo = htmlspecialchars(json_encode($jsonDecoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            } else {
                $conteudo = htmlspecialchars($rawContent);
            }
        } else {
            $conteudo = htmlspecialchars($rawContent);
        }
        echo "<h3>Editando: " . htmlspecialchars($_GET['abrir']) . "</h3>";
        echo "<form method='post'>";
        echo "<textarea name='conteudo' rows='20'>$conteudo</textarea><br>";
        echo "<button>Salvar</button>";
        echo "</form><hr>";
    } else {
        echo "<p style='color: red;'>Arquivo não encontrado ou não permitido editar.</p><hr>";
    }
}

if ($_SESSION['permissao'] === 'total' && isset($_GET['ren'])) {
    echo "<form method='post'>Renomear '{$_GET['ren']}' para:<br><input name='novo_nome'><button>Renomear</button></form><hr>";
}
if ($_SESSION['permissao'] === 'total' && isset($_GET['move'])) {
    echo "<form method='post'>Mover '{$_GET['move']}' para:<br><input name='destino'><button>Mover</button></form><hr>";
}
?>

<?php if ($_SESSION['permissao'] === 'total'): ?>
<form method="post">
    <input name="criar" placeholder="Nome do arquivo ou pasta">
    <select name="tipo">
        <option value="arquivo">Arquivo</option>
        <option value="pasta">Pasta</option>
    </select>
    <button>Criar</button>
</form>

<form method="post" enctype="multipart/form-data">
    <input type="file" name="arquivos[]" multiple>
    <button>Enviar Arquivos</button>
</form>
<?php endif; ?>

<form method="post">
<input type="hidden" name="dir" value="<?= htmlspecialchars($dir) ?>">
<table>
<tr>
<?php if ($_SESSION['permissao'] === 'total') echo "<th>✔</th>"; ?>
<th>Nome</th><th>Tamanho</th><th>Ações</th>
</tr>
<?php listarArquivos($dir); ?>
</table>

<?php if ($_SESSION['permissao'] === 'total'):
    $pastas = listarPastas($dir);
    echo '<br><label for="destino_multi">Mover para:</label>';
    echo '<select name="destino_multi">';
    foreach ($pastas as $p) {
        echo '<option value="' . htmlspecialchars($dir . DIRECTORY_SEPARATOR . $p) . '">' . htmlspecialchars($p) . '</option>';
    }
    echo '</select><br><button>Mover Selecionados</button>';
endif; ?>
</form>
</body>
</html>