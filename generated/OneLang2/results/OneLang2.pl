use strict;
use warnings;

require "one.pl";

package TokenKind;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

our $number = "number";
our $identifier = "identifier";
our $operator_x = "operator";
our $string_x = "string";

package Token;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $kind, $value ) = @_;
    $self->{value} = $value;
    $self->{kind} = $kind;
    return $self;
}

package ExprLangLexer;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $expression, $operators ) = @_;
    $self->{operators} = $operators;
    $self->{expression} = $expression;
    if (!$self->tryToReadNumber()) {
        $self->tryToReadOperator();
        $self->tryToReadLiteral();
    }
    
    while ($self->hasMoreToken()) {
        if (!$self->tryToReadOperator()) {
            $self->fail("expected operator here");
        }
        $self->tryToReadLiteral();
    }
    return $self;
}

sub fail {
    my ( $self, $message ) = @_;
    my $context = (substr $self->{expression}, $self->{offset}, ($self->{offset} + 30 - $self->{offset})) . "...";
    die "TokenizerException: @{[$message]} at '@{[$context]}' (offset: @{[$self->{offset}]})"."\n";
}

sub hasMoreToken {
    my ( $self ) = @_;
    $self->skipWhitespace();
    return !$self->eof();
}

sub add {
    my ( $self, $kind, $value ) = @_;
    push @$self->{tokens}, new Token($kind, $value);
    $self->{offset} += length($value);
}

sub tryToMatch {
    my ( $self, $pattern ) = @_;
    my $matches = ::($pattern, $self->{expression}, $self->{offset});
    return ${$matches}[0];
}

sub tryToReadOperator {
    my ( $self ) = @_;
    $self->skipWhitespace();
    foreach my $op (@{$self->{operators}}) {
        if ((substr $self->{expression}, $self->{offset}, length($op)) eq ($op)) {
            $self->add($TokenKind::operator_x, $op);
            return 1;
        }
    }
    return 0;
}

sub tryToReadNumber {
    my ( $self ) = @_;
    $self->skipWhitespace();
    my $number = $self->tryToMatch("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)");
    if ($number eq "") {
        return 0;
    }
    
    $self->add($TokenKind::number, $number);
    if ($self->tryToMatch("[0-9a-zA-Z]")) {
        $self->fail("invalid character in number");
    }
    
    return 1;
}

sub tryToReadIdentifier {
    my ( $self ) = @_;
    $self->skipWhitespace();
    my $identifier = $self->tryToMatch("[a-zA-Z_][a-zA-Z0-9_]*");
    if ($identifier eq "") {
        return 0;
    }
    
    $self->add($TokenKind::identifier, $identifier);
    return 1;
}

sub tryToReadString {
    my ( $self ) = @_;
    $self->skipWhitespace();
    
    my $match = $self->tryToMatch("\'(\\\\\'|[^\'])*\'");
    if ($match == undef) {
        $match = $self->tryToMatch("\"(\\\\\"|[^\"])*\"");
    }
    if ($match == undef) {
        return 0;
    }
    
    my $str = (substr $match, 1, (1 + length($match) - 2 - 1));
    $str = (substr $match, 0, 1) eq "\'" ? One::str_replace($str, "\\\'", "\'") : One::str_replace($str, "\\\"", "\"");
    push @$self->{tokens}, new Token($TokenKind::string_x, $str);
    $self->{offset} += length($match);
    return 1;
}

sub eof {
    my ( $self ) = @_;
    return $self->{offset} >= length($self->{expression});
}

sub skipWhitespace {
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

sub tryToReadLiteral {
    my ( $self ) = @_;
    my $success = $self->tryToReadIdentifier() || $self->tryToReadNumber() || $self->tryToReadString();
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

sub testMethod {
    my ( $self ) = @_;
    my $lexer = new ExprLangLexer("1+2", ["+"]);
    print(("Token count: @{[scalar(@{$lexer->{tokens}})]}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->testMethod();
};
if ($@) {
    print "Exception: " . $@
}