use strict;
use warnings;

use one;

package TokenKind;

use constant {      
    NUMBER => 'Number',
    IDENTIFIER => 'Identifier',
    OPERATOR_ => 'Operator_',
    STRING_ => 'String_',
};

package Token;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $kind, $value ) = @_;
    $self->{kind} = $kind;
    $self->{value} = $value;
    return $self;
}

package ExprLangLexer;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $expression, $operators ) = @_;
    $self->{offset} = 0;
    $self->{tokens} = [];
    $self->{expression} = $expression;
    $self->{operators} = $operators;
    if (!$self->try_to_read_number()) {
        $self->try_to_read_operator();
        $self->try_to_read_literal();
    }
    
    while ($self->has_more_token()) {
        if (!$self->try_to_read_operator()) {
            $self->fail("expected operator here");
        }
        if (!$self->try_to_read_literal()) {
            $self->fail("expected literal here");
        }
    }
    return $self;
}

sub fail {
    my ( $self, $message ) = @_;
    my $end_offset = $self->{offset} + 30;
    if ($end_offset > length($self->{expression})) {
        $end_offset = length($self->{expression});
    }
    my $context = (substr $self->{expression}, $self->{offset}, ($end_offset - $self->{offset})) . "...";
    die "TokenizerException: @{[$message]} at '@{[$context]}' (offset: @{[$self->{offset}]})"."\n";
}

sub has_more_token {
    my ( $self ) = @_;
    $self->skip_whitespace();
    return !$self->eof();
}

sub add {
    my ( $self, $kind, $value ) = @_;
    push @{$self->{tokens}}, new Token($kind, $value);
    $self->{offset} += length($value);
}

sub try_to_match {
    my ( $self, $pattern ) = @_;
    my $matches = OneRegex::match_from_index($pattern, $self->{expression}, $self->{offset});
    return !defined $matches ? "" : ${$matches}[0];
}

sub try_to_read_operator {
    my ( $self ) = @_;
    $self->skip_whitespace();
    foreach my $op (@{$self->{operators}}) {
        if ((substr $self->{expression}, $self->{offset}, length($op)) eq ($op)) {
            $self->add(TokenKind->OPERATOR_, $op);
            return 1;
        }
    }
    return 0;
}

sub try_to_read_number {
    my ( $self ) = @_;
    $self->skip_whitespace();
    
    my $number = $self->try_to_match("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)");
    if ($number eq "") {
        return 0;
    }
    
    $self->add(TokenKind->NUMBER, $number);
    
    if ($self->try_to_match("[0-9a-zA-Z]") ne "") {
        $self->fail("invalid character in number");
    }
    
    return 1;
}

sub try_to_read_identifier {
    my ( $self ) = @_;
    $self->skip_whitespace();
    my $identifier = $self->try_to_match("[a-zA-Z_][a-zA-Z0-9_]*");
    if ($identifier eq "") {
        return 0;
    }
    
    $self->add(TokenKind->IDENTIFIER, $identifier);
    return 1;
}

sub try_to_read_string {
    my ( $self ) = @_;
    $self->skip_whitespace();
    
    my $match = $self->try_to_match("'(\\\\'|[^'])*'");
    if ($match eq "") {
        $match = $self->try_to_match("\"(\\\\\"|[^\"])*\"");
    }
    if ($match eq "") {
        return 0;
    }
    
    my $str = (substr $match, 1, (1 + length($match) - 2 - 1));
    $str = (substr $match, 0, 1) eq "'" ? One::str_replace($str, "\\'", "'") : One::str_replace($str, "\\\"", "\"");
    push @{$self->{tokens}}, new Token(TokenKind->STRING_, $str);
    $self->{offset} += length($match);
    return 1;
}

sub eof {
    my ( $self ) = @_;
    return $self->{offset} >= length($self->{expression});
}

sub skip_whitespace {
    my ( $self ) = @_;
    while (!$self->eof()) {
        my $c = (substr $self->{expression}, $self->{offset}, 1);
        if ($c eq " " || $c eq "\n" || $c eq "\t" || $c eq "\r") {
            $self->{offset}++;
        } else {
            last;
        }
    }
}

sub try_to_read_literal {
    my ( $self ) = @_;
    my $success = $self->try_to_read_identifier() || $self->try_to_read_number() || $self->try_to_read_string();
    return $success;
}

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    my $lexer = new ExprLangLexer("1+2", ["+"]);
    my $result = "";
    foreach my $token (@{$lexer->{tokens}}) {
        if ($result ne "") {
            $result .= ", ";
        }
        $result .= $token->{value};
    }
    
    print(("[@{[scalar(@{$lexer->{tokens}})]}]: @{[$result]}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}