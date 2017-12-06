use strict;
use warnings;

package TokenType;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

our $end_token = "EndToken";
our $whitespace = "Whitespace";
our $identifier = "Identifier";
our $operator_x = "Operator";

package Token;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $value,$is_operator ) = @_;
    $self->{is_operator} = $is_operator;
    $self->{value} = $value;
    return $self;
}

package StringHelper;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub startsWithAtIndex {
    my ( $self, $str, $substr, $idx ) = @_;
    return substr $str, $idx, ($idx + length($substr) - $idx) == $substr;
}

package Tokenizer;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    my ( $text,$operators ) = @_;
    $self->{operators} = @operators;
    $self->{text} = $text;
    $self->{offset} = 0;
    return $self;
}

sub getTokenType {
    my ( $self ) = @_;
    if ($self->{offset} >= length($self->{text})) {
        return $TokenType::end_token;
    }
    
    my $c = substr $self->{text}, $self->{offset}, 1;
    return $c == " " || $c == "\n" || $c == "\t" || $c == "\r" ? $TokenType::whitespace : ("A" le $c && $c le "Z") || ("a" le $c && $c le "z") || ("0" le $c && $c le "9") || $c == "_" ? $TokenType::identifier : $TokenType::operator_x;
}

sub tokenize {
    my ( $self ) = @_;
    my @result = ();
    
    while ($self->{offset} < length($self->{text})) {
        my $char_type = $self->getTokenType();
        if ($char_type == $TokenType::whitespace) {
            while ($self->getTokenType() == $TokenType::whitespace) {
                $self->{offset}++;
            }
        } elsif ($char_type == $TokenType::identifier) {
            my $start_offset = $self->{offset};
            while ($self->getTokenType() == $TokenType::identifier) {
                $self->{offset}++;
            }
            my $identifier = substr $self->{text}, $start_offset, ($self->{offset} - $start_offset);
            push @result, new Token($identifier, 0);
        } else {
            my $op = "";
            foreach my $curr_op ($self->{operators}) {
                if (StringHelper::startsWithAtIndex($self->{text}, $curr_op, $self->{offset})) {
                    $op = $curr_op;
                    last;
                }
            }
            if ($op == "") {
                return undef;
            }
            $self->{offset} += length($op);
            push @result, new Token($op, 1);
        }
    }
    
    return @result;
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
    my @operators = ("<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", ".");
    
    my $input = "hello * 5";
    my $tokenizer = new Tokenizer($input, @operators);
    my @result = $tokenizer->tokenize();
    
    print(("token count:") . "\n");
    print((scalar(@result)) . "\n");
    foreach my $item (@result) {
        print(($item->{value} . "(" . ($item->{is_operator} ? "op" : "id") . ")") . "\n");
    }
}

package Program;
my $c = new TestClass();
$c->testMethod();